"""
Training script for phishing URL detection models.
Trains Random Forest and Logistic Regression; saves artifacts for PhishingDetector.
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from app.features.url_features import FEATURE_NAMES, extract_features

# Paths relative to ml-service root
_ML_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = _ML_ROOT / "app" / "training" / "dataset" / "phishing_urls.csv"
MODEL_DIR = _ML_ROOT / "models"


def augment_data(df: pd.DataFrame, target_size: int = 10000) -> pd.DataFrame:
    print(f"Augmenting dataset from {len(df)} to {target_size} rows...")
    import random
    import string
    
    new_rows = []
    base_urls = df.to_dict('records')
    
    while len(base_urls) + len(new_rows) < target_size:
        base = random.choice(base_urls)
        url = base["url"]
        label = base["label"]
        
        transform_type = random.randint(1, 4)
        if transform_type == 1:
            suffix = ''.join(random.choices(string.ascii_lowercase, k=random.randint(4, 10)))
            url = f"{url}/{suffix}"
        elif transform_type == 2:
            prefix = ''.join(random.choices(string.ascii_lowercase, k=random.randint(3, 8)))
            if "://" in url:
                parts = url.split("://")
                url = f"{parts[0]}://{prefix}.{parts[1]}"
            else:
                url = f"{prefix}.{url}"
        elif transform_type == 3:
            tlds = [".com", ".net", ".org", ".xyz", ".info", ".biz"]
            for t in tlds:
                if url.endswith(t):
                    url = url.replace(t, random.choice(tlds))
                    break
        elif transform_type == 4:
            param = ''.join(random.choices(string.ascii_lowercase, k=4))
            val = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            delim = "&" if "?" in url else "?"
            url = f"{url}{delim}{param}={val}"
            
        new_rows.append({"url": url, "label": label})
        
    augmented_df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
    return augmented_df.sample(frac=1, random_state=42).reset_index(drop=True)

def load_dataset() -> pd.DataFrame:
    """Load and augment the phishing URLs dataset."""
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    return augment_data(df, 10000)


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Extract features from all URLs in the dataset."""
    print("Extracting features from URLs (this may take a minute)...")
    import random
    features_list = []
    labels = []

    for url, label in zip(df["url"], df["label"], strict=False):
        try:
            feats = extract_features(url, skip_whois=True)
            features_list.append(feats)
            labels.append(label)
        except Exception as exc:
            pass

    X = pd.DataFrame(features_list, columns=FEATURE_NAMES)
    y = pd.Series(labels, name="label")
    return X, y


from sklearn.model_selection import train_test_split, cross_val_score, KFold

def train_models(X: pd.DataFrame, y: pd.Series):
    """Train Random Forest and Logistic Regression classifiers with Cross-Validation."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    print("\nTraining Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        random_state=42,
        n_jobs=-1,
    )
    
    # Cross Validation
    rf_cv_scores = cross_val_score(rf_model, X_train, y_train, cv=cv, scoring='accuracy')
    print(f"Random Forest CV Accuracy (5-Fold): {rf_cv_scores.mean():.4f} (+/- {rf_cv_scores.std() * 2:.4f})")
    
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    print(f"Random Forest Test Accuracy: {accuracy_score(y_test, rf_pred):.4f}")
    print(f"Random Forest Test F1: {f1_score(y_test, rf_pred):.4f}")

    print("\nTraining Logistic Regression...")
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    
    # Cross Validation
    lr_cv_scores = cross_val_score(lr_model, X_train, y_train, cv=cv, scoring='accuracy')
    print(f"Logistic Regression CV Accuracy (5-Fold): {lr_cv_scores.mean():.4f} (+/- {lr_cv_scores.std() * 2:.4f})")
    
    lr_model.fit(X_train, y_train)
    lr_pred = lr_model.predict(X_test)
    print(f"Logistic Regression Test Accuracy: {accuracy_score(y_test, lr_pred):.4f}")
    print(f"Logistic Regression Test F1: {f1_score(y_test, lr_pred):.4f}")

    return rf_model, lr_model


def save_models(rf_model, lr_model) -> None:
    """Save trained models using filenames expected by PhishingDetector."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\nSaving models to {MODEL_DIR}...")
    joblib.dump(rf_model, MODEL_DIR / "random_forest_model.joblib")
    joblib.dump(lr_model, MODEL_DIR / "logistic_regression_model.joblib")
    joblib.dump(FEATURE_NAMES, MODEL_DIR / "feature_names.joblib")
    print("Models saved successfully!")


def train_and_save_models() -> None:
    """Full training pipeline invoked by PhishingDetector and CLI."""
    df = load_dataset()
    print(f"Dataset size: {len(df)}")
    print(f"Phishing URLs: {(df['label'] == 1).sum()}")
    print(f"Legitimate URLs: {(df['label'] == 0).sum()}")

    X, y = prepare_features(df)
    print(f"Features extracted: {X.shape}")

    rf_model, lr_model = train_models(X, y)
    save_models(rf_model, lr_model)


def main() -> None:
    """CLI entry point."""
    print("=" * 60)
    print("Phishing URL Detection Model Training")
    print("=" * 60)
    train_and_save_models()
    print("\n" + "=" * 60)
    print("Training completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
