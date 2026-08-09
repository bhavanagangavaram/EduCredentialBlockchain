import cv2
import numpy as np
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
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

def extract_face_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)

    if len(faces) == 0:
        return None

    x, y, w, h = faces[0]
    face_roi = cv2.resize(gray[y:y+h, x:x+w], (64, 64))

    # Feature 1: Pixel histogram (64 bins)
    hist = cv2.calcHist([face_roi], [0], None, [64], [0, 256])
    hist = cv2.normalize(hist, hist).flatten()

    # Feature 2: Gradient features
    sobelx = cv2.Sobel(face_roi, cv2.CV_64F, 1, 0)
    sobely = cv2.Sobel(face_roi, cv2.CV_64F, 0, 1)
    grad_mean = np.mean(np.sqrt(sobelx**2 + sobely**2))
    grad_std  = np.std(np.sqrt(sobelx**2 + sobely**2))

    # Feature 3: Pixel statistics
    pix_mean = np.mean(face_roi)
    pix_std  = np.std(face_roi)

    # Combine all features
    features = np.concatenate([
        hist,
        [grad_mean, grad_std, pix_mean, pix_std]
    ])
    return features

# ── STEP 2: Load LFW Dataset ──
print("Loading LFW Dataset...")
print("Reading from: d:/FinalProj/dataset/lfw/lfw-deepfunneled/")

dataset_path = "d:/FinalProj/dataset/lfw/lfw-deepfunneled/lfw-deepfunneled"

# Check folder structure
subfolders = [f for f in os.listdir(dataset_path)
              if os.path.isdir(os.path.join(dataset_path, f))]
print(f"Found {len(subfolders)} person folders")

X, y = [], []
skipped = 0
processed = 0

for person_name in subfolders:
    person_path = os.path.join(dataset_path, person_name)
    images = [f for f in os.listdir(person_path)
              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    # Need at least 2 images per person
    if len(images) < 2:
        skipped += 1
        continue

    for img_file in images:
        img_path = os.path.join(person_path, img_file)
        features = extract_face_features(img_path)
        if features is not None:
            X.append(features)
            y.append(person_name)
            processed += 1

    if processed % 100 == 0:
        print(f"Processed {processed} images...")

print(f"\nDataset loaded!")
print(f"Total images    : {processed}")
print(f"Total persons   : {len(set(y))}")
print(f"Skipped folders : {skipped} (less than 2 images)")

X = np.array(X)
le = LabelEncoder()
y_encoded = le.fit_transform(y)

print(f"Feature size    : {X.shape[1]}")

# ── STEP 3: Filter — keep only persons with 2+ images ──
from collections import Counter as C
counts = C(y_encoded)
valid_idx = [i for i, label in enumerate(y_encoded) if counts[label] >= 2]
X = X[valid_idx]
y_encoded = y_encoded[valid_idx]

print(f"Samples after filtering : {len(X)}")
print(f"Persons after filtering : {len(set(y_encoded))}")

# ── STEP 4: 10-Fold Cross Validation ──
print("\n[Running 10-Fold Cross Validation...]")

model = RandomForestClassifier(
    n_estimators=100,
    class_weight='balanced',
    random_state=42
)

kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)

precisions, recalls, f1s = [], [], []

for fold, (train_idx, val_idx) in enumerate(kf.split(X, y_encoded)):
    X_tr, X_val = X[train_idx], X[val_idx]
    y_tr, y_val = y_encoded[train_idx], y_encoded[val_idx]

    model.fit(X_tr, y_tr)
    y_pred = model.predict(X_val)

    p = precision_score(y_val, y_pred, average='weighted', zero_division=0)
    r = recall_score(y_val, y_pred, average='weighted', zero_division=0)
    f = f1_score(y_val, y_pred, average='weighted', zero_division=0)

    precisions.append(p)
    recalls.append(r)
    f1s.append(f)
    print(f"Fold {fold+1:2d}: P={p:.3f}  R={r:.3f}  F1={f:.3f}")

mean_p  = np.mean(precisions) * 100
mean_r  = np.mean(recalls)    * 100
mean_f1 = np.mean(f1s)        * 100

# ── STEP 5: Confusion Matrix (Top 5 persons only) ──
top5_persons = [label for label, count in
                Counter(y_encoded).most_common(5)]
top5_idx = [i for i, label in enumerate(y_encoded)
            if label in top5_persons]

X_top5 = X[top5_idx]
y_top5 = y_encoded[top5_idx]

model.fit(X_top5, y_top5)
y_pred_top5 = model.predict(X_top5)

top5_names = [le.classes_[i] for i in top5_persons]
cm = confusion_matrix(y_top5, y_pred_top5)

plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=top5_names,
            yticklabels=top5_names)
plt.title('Face Recognition Confusion Matrix (Top 5 Persons)')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
save_path = 'd:/FinalProj/face_recognition_confusion_matrix.png'
plt.savefig(save_path, dpi=300)
print(f"\nConfusion matrix saved: {save_path}")

# ── STEP 6: Final Results ──
print("\n" + "=" * 45)
print("FACE RECOGNITION — FINAL RESULTS")
print("=" * 45)
print(f"| Precision : {mean_p:>5.1f}%                    |")
print(f"| Recall    : {mean_r:>5.1f}%                    |")
print(f"| F1-Score  : {mean_f1:>5.1f}%                    |")
print("=" * 45)
print(f"\nNote: Evaluated on {len(X)} images")
print(f"      from {len(set(y_encoded))} persons in LFW dataset")
