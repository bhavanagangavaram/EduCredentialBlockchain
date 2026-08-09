import cv2
import numpy as np
import os
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report
from imblearn.over_sampling import SMOTE
from collections import Counter
import seaborn as sns
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

# ── STEP 1: Feature Extraction ──
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def extract_spoof_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (64, 64))

    # Feature 1: Gradient (texture)
    sobelx = cv2.Sobel(resized, cv2.CV_64F, 1, 0)
    sobely = cv2.Sobel(resized, cv2.CV_64F, 0, 1)
    grad = np.sqrt(sobelx**2 + sobely**2)
    grad_mean = np.mean(grad)
    grad_std  = np.std(grad)

    # Feature 2: Frequency (FFT)
    f_transform = np.fft.fft2(resized)
    f_shift     = np.fft.fftshift(f_transform)
    magnitude   = np.abs(f_shift)
    freq_mean   = np.mean(magnitude)
    freq_std    = np.std(magnitude)

    # Feature 3: Pixel statistics
    pix_mean = np.mean(resized)
    pix_std  = np.std(resized)

    # Feature 4: Laplacian (blur detection)
    laplacian = cv2.Laplacian(resized, cv2.CV_64F)
    lap_var   = np.var(laplacian)

    # Feature 5: Face detection confidence
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    num_faces = len(faces)
    face_area = (faces[0][2] * faces[0][3]) if num_faces > 0 else 0

    return [
        grad_mean, grad_std,
        freq_mean, freq_std,
        pix_mean, pix_std,
        lap_var,
        num_faces, face_area
    ]

# ── STEP 2: Load Dataset ──
print("Loading CelebA Spoof Dataset...")

photo_path = "D:/FinalProj/dataset/celeba_spoof/photo"
video_path = "D:/FinalProj/dataset/celeba_spoof/video"

X, y = [], []
processed = 0

# Load REAL photos → label 0
print("Loading real photos (label 0)...")
photo_files = [f for f in os.listdir(photo_path)
               if f.lower().endswith(('.jpg','.jpeg','.png'))]

for img_file in photo_files[:500]:  # max 500 real
    img_path = os.path.join(photo_path, img_file)
    features = extract_spoof_features(img_path)
    if features is not None:
        X.append(features)
        y.append(0)  # real
        processed += 1

print(f"Real photos loaded: {processed}")

# Load SPOOF videos (first frame) → label 1
print("Loading spoof videos (label 1)...")
spoof_count = 0
video_files = [f for f in os.listdir(video_path)
               if f.lower().endswith(('.jpg','.jpeg','.png','.mp4','.avi'))]

for vid_file in video_files[:500]:  # max 500 spoof
    vid_path = os.path.join(video_path, vid_file)

    # If it is an image
    if vid_file.lower().endswith(('.jpg','.jpeg','.png')):
        features = extract_spoof_features(vid_path)
        if features is not None:
            X.append(features)
            y.append(1)  # spoof
            spoof_count += 1

    # If it is a video — extract first frame
    elif vid_file.lower().endswith(('.mp4','.avi')):
        cap = cv2.VideoCapture(vid_path)
        ret, frame = cap.read()
        cap.release()
        if ret:
            tmp_path = "D:/FinalProj/dataset/celeba_spoof/tmp_frame.jpg"
            cv2.imwrite(tmp_path, frame)
            features = extract_spoof_features(tmp_path)
            if features is not None:
                X.append(features)
                y.append(1)  # spoof
                spoof_count += 1

print(f"Spoof samples loaded: {spoof_count}")

X = np.array(X)
y = np.array(y)

print(f"\nDataset loaded!")
print(f"Total samples     : {len(X)}")
print(f"Features          : {X.shape[1]}")
print(f"Distribution      : {Counter(y)}")
print(f"  Real  (label 0) : {Counter(y)[0]}")
print(f"  Spoof (label 1) : {Counter(y)[1]}")

# ── STEP 3: SMOTE + 10-Fold CV ──
print("\n[Running SMOTE + 10-Fold Cross Validation...]")

ensemble = VotingClassifier(
    estimators=[
        ('rf', RandomForestClassifier(
            n_estimators=100, class_weight='balanced', random_state=42)),
        ('svm', SVC(
            kernel='rbf', C=10, gamma='scale',
            probability=True, class_weight='balanced', random_state=42))
    ],
    voting='soft'
)

sm = SMOTE(random_state=42)
kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)

precisions, recalls, f1s = [], [], []

for fold, (train_idx, val_idx) in enumerate(kf.split(X, y)):
    X_tr, X_val = X[train_idx], X[val_idx]
    y_tr, y_val = y[train_idx], y[val_idx]

    # SMOTE inside fold only
    X_tr_res, y_tr_res = sm.fit_resample(X_tr, y_tr)

    ensemble.fit(X_tr_res, y_tr_res)
    y_pred = ensemble.predict(X_val)

    p = precision_score(y_val, y_pred, zero_division=0)
    r = recall_score(y_val, y_pred, zero_division=0)
    f = f1_score(y_val, y_pred, zero_division=0)

    precisions.append(p)
    recalls.append(r)
    f1s.append(f)
    print(f"Fold {fold+1:2d}: P={p:.3f}  R={r:.3f}  F1={f:.3f}")

mean_p  = np.mean(precisions) * 100
mean_r  = np.mean(recalls)    * 100
mean_f1 = np.mean(f1s)        * 100

# ── STEP 4: Confusion Matrix ──
X_res, y_res = sm.fit_resample(X, y)
ensemble.fit(X_res, y_res)
y_pred_final = ensemble.predict(X_res)

cm = confusion_matrix(y_res, y_pred_final)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Real', 'Spoof'],
            yticklabels=['Real', 'Spoof'])
plt.title('Anti-Spoofing Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
save_path = 'D:/FinalProj/antispoofing_confusion_matrix.png'
plt.savefig(save_path, dpi=300)
print(f"\nConfusion matrix saved: {save_path}")

# ── STEP 5: Final Results ──
print("\n" + "="*45)
print("ANTI-SPOOFING — FINAL RESULTS")
print("="*45)
print(f"| Precision : {mean_p:>5.1f}%                    |")
print(f"| Recall    : {mean_r:>5.1f}%                    |")
print(f"| F1-Score  : {mean_f1:>5.1f}%                    |")
print("="*45)

print("\n" + classification_report(
    y_res, y_pred_final,
    target_names=['Real', 'Spoof']
))
