import cv2
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report
from imblearn.over_sampling import SMOTE
from collections import Counter
import seaborn as sns
import matplotlib.pyplot as plt
import os
import warnings
warnings.filterwarnings('ignore')

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def extract_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (64, 64))
    hist = cv2.calcHist([resized],[0],None,[32],[0,256])
    hist = cv2.normalize(hist, hist).flatten()
    sobelx = cv2.Sobel(resized, cv2.CV_64F, 1, 0)
    sobely = cv2.Sobel(resized, cv2.CV_64F, 0, 1)
    grad_mean = np.mean(np.sqrt(sobelx**2 + sobely**2))
    grad_std  = np.std(np.sqrt(sobelx**2  + sobely**2))
    pix_mean  = np.mean(resized)
    pix_std   = np.std(resized)
    return np.concatenate([hist,[grad_mean,grad_std,pix_mean,pix_std]])

lfw_path = "D:/FinalProj/dataset/lfw/lfw-deepfunneled/lfw-deepfunneled"

print("Loading match pairs...")
match_df    = pd.read_csv("D:/FinalProj/dataset/lfw/matchpairsDevTest.csv",    header=None)
mismatch_df = pd.read_csv("D:/FinalProj/dataset/lfw/mismatchpairsDevTest.csv", header=None)

X, y = [], []

def get_img_path(name, num):
    return os.path.join(lfw_path, name, f"{name}_{int(num):04d}.jpg")

print("Processing match pairs (label=1)...")
for _, row in match_df.iterrows():
    try:
        p1 = get_img_path(str(row[0]), row[1])
        p2 = get_img_path(str(row[0]), row[2])
        f1 = extract_features(p1)
        f2 = extract_features(p2)
        if f1 is not None and f2 is not None:
            diff = np.abs(f1 - f2)
            X.append(diff)
            y.append(1)
    except:
        continue

print(f"Match pairs loaded: {len(y)}")

print("Processing mismatch pairs (label=0)...")
for _, row in mismatch_df.iterrows():
    try:
        p1 = get_img_path(str(row[0]), row[1])
        p2 = get_img_path(str(row[2]), row[3])
        f1 = extract_features(p1)
        f2 = extract_features(p2)
        if f1 is not None and f2 is not None:
            diff = np.abs(f1 - f2)
            X.append(diff)
            y.append(0)
    except:
        continue

X = np.array(X)
y = np.array(y)
print(f"\nTotal pairs: {len(X)}")
print(f"Distribution: {Counter(y)}")

print("\n[Running SMOTE + 10-Fold CV...]")
sm = SMOTE(random_state=42)
kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
model = RandomForestClassifier(
    n_estimators=100, class_weight='balanced', random_state=42
)

precisions, recalls, f1s = [], [], []

for fold, (tr_idx, val_idx) in enumerate(kf.split(X, y)):
    X_tr, X_val = X[tr_idx], X[val_idx]
    y_tr, y_val = y[tr_idx], y[val_idx]
    X_tr_r, y_tr_r = sm.fit_resample(X_tr, y_tr)
    model.fit(X_tr_r, y_tr_r)
    y_pred = model.predict(X_val)
    p = precision_score(y_val, y_pred, zero_division=0)
    r = recall_score(y_val, y_pred, zero_division=0)
    f = f1_score(y_val, y_pred, zero_division=0)
    precisions.append(p)
    recalls.append(r)
    f1s.append(f)
    print(f"Fold {fold+1:2d}: P={p:.3f}  R={r:.3f}  F1={f:.3f}")

mean_p  = np.mean(precisions)*100
mean_r  = np.mean(recalls)*100
mean_f1 = np.mean(f1s)*100

# Confusion Matrix
model.fit(X, y)
y_pred_f = model.predict(X)
cm = confusion_matrix(y, y_pred_f)
plt.figure(figsize=(5,4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['No Match','Match'],
            yticklabels=['No Match','Match'])
plt.title('Face Recognition Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('D:/FinalProj/face_recognition_confusion_matrix.png', dpi=300)
print("\nConfusion matrix saved!")

print("\n"+"="*45)
print("FACE RECOGNITION — FINAL RESULTS")
print("="*45)
print(f"| Precision : {mean_p:>5.1f}%                    |")
print(f"| Recall    : {mean_r:>5.1f}%                    |")
print(f"| F1-Score  : {mean_f1:>5.1f}%                    |")
print("="*45)
print(classification_report(y, y_pred_f,
      target_names=['No Match','Match']))