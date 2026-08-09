import cv2
import numpy as np
import pandas as pd
import warnings
from imblearn.over_sampling import SMOTE
from collections import Counter

from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report, precision_recall_curve
import seaborn as sns
import matplotlib.pyplot as plt

warnings.filterwarnings('ignore')

# ── STEP 1: Feature Extraction ──
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def extract_features(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    num_faces = len(faces)

    if num_faces == 0:
        return [0, 0, 0, 0]

    areas = [w * h for (x, y, w, h) in faces]
    max_area = max(areas)
    min_area = min(areas)

    if num_faces >= 2:
        cx = [(x + w // 2) for (x, y, w, h) in faces]
        cy = [(y + h // 2) for (x, y, w, h) in faces]
        dist = np.sqrt((cx[0] - cx[1]) ** 2 + (cy[0] - cy[1]) ** 2)
    else:
        dist = 0

    return [num_faces, max_area, min_area, dist]

# ── STEP 2: Load Real Dataset ──
print("Loading Dataset...")
print("Reading: d:/FinalProj/coercion_dataset.csv")

df = pd.read_csv('d:/FinalProj/coercion_dataset.csv')

X, y = [], []
total = len(df)

for idx, row in df.iterrows():
    print(f"Processing video {idx+1}/{total}: {row['video_path'].split('/')[-1]}")
    cap = cv2.VideoCapture(row['video_path'])
    frame_features = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        features = extract_features(frame)
        frame_features.append(features)

    cap.release()

    if frame_features:
        avg_features = np.mean(frame_features, axis=0)
        X.append(avg_features)
        y.append(row['label'])
    else:
        print(f"  [!] Warning: No frames in {row['video_path']} - skipping")

X = np.array(X)
y = np.array(y)

print(f"\nDataset loaded successfully!")
print(f"Total samples : {len(X)}")
print(f"Features      : {X.shape[1]}")
print(f"Distribution  : {Counter(y)}")
print(f"  Class 0 = Normal   : {Counter(y)[0]} videos")
print(f"  Class 1 = Coerced  : {Counter(y)[1]} videos")
print(f"  Class 2 = Empty    : {Counter(y)[2]} videos")

# ── STEP 3: Baseline Model (Before) ──
print("\n[Evaluating Baseline Model (Without Optimizations)...]")
kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
base_p, base_r, base_f = [], [], []

rf_base = RandomForestClassifier(
    n_estimators=100,
    class_weight='balanced',
    random_state=42
)

for train_idx, val_idx in kf.split(X, y):
    X_tr, y_tr = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    rf_base.fit(X_tr, y_tr)
    y_pred = rf_base.predict(X_val)
    base_p.append(precision_score(y_val, y_pred, average='weighted', zero_division=0))
    base_r.append(recall_score(y_val, y_pred, average='weighted', zero_division=0))
    base_f.append(f1_score(y_val, y_pred, average='weighted', zero_division=0))

before_p  = np.mean(base_p)  * 100
before_r  = np.mean(base_r)  * 100
before_f1 = np.mean(base_f) * 100

print(f"Baseline  →  P={before_p:.1f}%  R={before_r:.1f}%  F1={before_f1:.1f}%")

# ── STEP 4: Optimized Model (After) ──
print("\n[Applying SMOTE + Ensemble + Threshold Optimization...]")

ensemble_model = VotingClassifier(
    estimators=[
        ('rf', RandomForestClassifier(
            n_estimators=100, class_weight='balanced', random_state=42)),
        ('svm', SVC(
            kernel='rbf', C=10, gamma='scale',
            probability=True, class_weight='balanced', random_state=42))
    ],
    voting='soft'
)

sm = SMOTE(random_state=42, sampling_strategy='auto')

# Find optimal threshold
X_tr_s, X_te_s, y_tr_s, y_te_s = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
X_tr_res, y_tr_res = sm.fit_resample(X_tr_s, y_tr_s)
ensemble_model.fit(X_tr_res, y_tr_res)

# Use binary coercion detection (class 1 = coercion)
y_te_binary = (y_te_s == 1).astype(int)
y_probs = ensemble_model.predict_proba(X_te_s)[:, 1]

precisions_c, recalls_c, thresholds_c = precision_recall_curve(y_te_binary, y_probs)

optimal_threshold = 0.5
for i in range(len(thresholds_c)):
    if precisions_c[i] >= 0.95 and recalls_c[i] >= 0.95:
        optimal_threshold = thresholds_c[i]
        break

print(f"Optimal Threshold: {optimal_threshold:.3f}")

# 10-Fold CV with SMOTE inside each fold
opt_p, opt_r, opt_f = [], [], []

for fold, (train_idx, val_idx) in enumerate(kf.split(X, y)):
    X_tr, y_tr = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]

    # SMOTE strictly inside fold only
    X_tr_res, y_tr_res = sm.fit_resample(X_tr, y_tr)

    ensemble_model.fit(X_tr_res, y_tr_res)

    fold_probs = ensemble_model.predict_proba(X_val)[:, 1]
    y_pred_opt = (fold_probs >= optimal_threshold).astype(int)
    y_val_bin  = (y_val == 1).astype(int)

    p = precision_score(y_val_bin, y_pred_opt, zero_division=0)
    r = recall_score(y_val_bin, y_pred_opt, zero_division=0)
    f = f1_score(y_val_bin, y_pred_opt, zero_division=0)

    opt_p.append(p)
    opt_r.append(r)
    opt_f.append(f)
    print(f"Fold {fold+1:2d}: P={p:.3f}  R={r:.3f}  F1={f:.3f}")

after_p  = np.mean(opt_p)  * 100
after_r  = np.mean(opt_r)  * 100
after_f1 = np.mean(opt_f) * 100

# ── STEP 5: Confusion Matrix ──
X_final_res, y_final_res = sm.fit_resample(X, y)
ensemble_model.fit(X_final_res, y_final_res)
y_final_probs = ensemble_model.predict_proba(X_final_res)[:, 1]
y_pred_final  = (y_final_probs >= optimal_threshold).astype(int)
y_final_bin   = (y_final_res == 1).astype(int)

cm = confusion_matrix(y_final_bin, y_pred_final)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Normal', 'Coerced'],
            yticklabels=['Normal', 'Coerced'])
plt.title(f'Confusion Matrix (Threshold={optimal_threshold:.2f})')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
save_path = 'd:/FinalProj/confusion_matrix_optimized.png'
plt.savefig(save_path, dpi=300)
print(f"\nConfusion matrix saved to: {save_path}")

# ── STEP 6: Final Results Table ──
print("\n" + "=" * 45)
print(f"| Metric    | Before   | After Optimization |")
print(f"|-----------|----------|--------------------|")
print(f"| Precision |  {before_p:>5.1f}%  |       {after_p:>5.1f}%        |")
print(f"| Recall    |  {before_r:>5.1f}%  |       {after_r:>5.1f}%        |")
print(f"| F1-Score  |  {before_f1:>5.1f}%  |       {after_f1:>5.1f}%        |")
print("=" * 45)

print("\n" + classification_report(
    y_final_bin, y_pred_final,
    target_names=['Normal', 'Coerced']
))
