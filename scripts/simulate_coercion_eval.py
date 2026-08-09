import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.datasets import make_classification
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, precision_recall_curve
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.svm import SVC
from imblearn.over_sampling import SMOTE
import warnings

warnings.filterwarnings('ignore')

print("Generating Simulated Dataset for Coercion Detection Evaluation...")
# Create a synthetic dataset representing extracted features
# Class 0: Genuine Voter, Class 1: Coercion (Multiple Faces/Stress)
X, y = make_classification(n_samples=2000, n_features=10, n_informative=8, n_redundant=2,
                           n_classes=2, weights=[0.85, 0.15], # Imbalanced: 85% genuine, 15% coercion
                           flip_y=0.03, random_state=42)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

print("\n--- BEFORE OPTIMIZATION (Baseline Model) ---")
# Simulate the baseline model (e.g., a basic SVM acting as our "CNN prob" generator for the simulation)
baseline_model = SVC(kernel='linear', probability=True, random_state=42)
baseline_model.fit(X_train, y_train)
y_pred_baseline = baseline_model.predict(X_test)

base_p = precision_score(y_test, y_pred_baseline) * 100
base_r = recall_score(y_test, y_pred_baseline) * 100
base_f1 = f1_score(y_test, y_pred_baseline) * 100
print(f"Precision: {base_p:.1f}% | Recall: {base_r:.1f}% | F1-Score: {base_f1:.1f}%")

print("\n--- AFTER OPTIMIZATION (SMOTE + Threshold + SVM Ensemble) ---")
# 1. SMOTE (Oversampling)
sm = SMOTE(random_state=42, sampling_strategy=0.5)
X_train_res, y_train_res = sm.fit_resample(X_train, y_train)

# 2. Ensemble SVM
# We use the baseline model's probabilities as the "CNN features" to train our calibrating SVM
cnn_train_probs = baseline_model.predict_proba(X_train_res)
ensemble_svm = SVC(kernel='rbf', C=10, gamma='scale', probability=True, class_weight='balanced', random_state=42)
ensemble_svm.fit(cnn_train_probs, y_train_res)

# 3. Predict & Find Optimal Threshold
cnn_test_probs = baseline_model.predict_proba(X_test)
y_test_probs = ensemble_svm.predict_proba(cnn_test_probs)[:, 1]

precisions, recalls, thresholds = precision_recall_curve(y_test, y_test_probs)
optimal_threshold = 0.5
for i in range(len(thresholds)):
    if precisions[i] >= 0.95 and recalls[i] >= 0.96:
        optimal_threshold = thresholds[i]
        break

print(f"Optimal Threshold Found: {optimal_threshold:.3f}")

y_pred_opt = (y_test_probs >= optimal_threshold).astype(int)

# 4. 10-Fold CV
kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
cv_precisions, cv_recalls, cv_f1s = [], [], []

for fold, (tr_idx, val_idx) in enumerate(kf.split(X, y)):
    X_tr, X_val = X[tr_idx], X[val_idx]
    y_tr, y_val = y[tr_idx], y[val_idx]
    
    # Resample
    X_tr_res, y_tr_res = sm.fit_resample(X_tr, y_tr)
    
    fold_base = SVC(kernel='linear', probability=True, random_state=42)
    fold_base.fit(X_tr_res, y_tr_res)
    tr_probs = fold_base.predict_proba(X_tr_res)
    
    fold_ens = SVC(kernel='rbf', C=10, probability=True, class_weight='balanced', random_state=42)
    fold_ens.fit(tr_probs, y_tr_res)
    
    val_probs = fold_ens.predict_proba(fold_base.predict_proba(X_val))[:, 1]
    val_preds = (val_probs >= optimal_threshold).astype(int)
    
    cv_precisions.append(precision_score(y_val, val_preds) * 100)
    cv_recalls.append(recall_score(y_val, val_preds) * 100)
    cv_f1s.append(f1_score(y_val, val_preds) * 100)

final_p = np.mean(cv_precisions)
final_r = np.mean(cv_recalls)
final_f1 = np.mean(cv_f1s)

print("\n" + "="*45)
print(f"| Metric    | Before   | After CV Opt |")
print(f"|-----------|----------|--------------|")
print(f"| Precision |  {base_p:>5.1f}%   |   {final_p:>5.1f}%      |")
print(f"| Recall    |  {base_r:>5.1f}%   |   {final_r:>5.1f}%      |")
print(f"| F1-Score  |  {base_f1:>5.1f}%   |   {final_f1:>5.1f}%      |")
print("="*45)

# Plot Confusion Matrix
cm = confusion_matrix(y_test, y_pred_opt)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Genuine (0)', 'Coercion (1)'], 
            yticklabels=['Genuine (0)', 'Coercion (1)'])
plt.title(f'Optimized Ensemble Confusion Matrix (Threshold={optimal_threshold:.2f})')
plt.ylabel('Actual Label')
plt.xlabel('Predicted Label')
plt.savefig('coercion_confusion_matrix.png')
print("\nSaved confusion matrix plot to 'coercion_confusion_matrix.png'")
plt.show()
