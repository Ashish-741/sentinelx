import pandas as pd
import joblib
import os
import urllib.request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "email_model.joblib")
DATA_URL = "https://raw.githubusercontent.com/justmarkham/pycon-2016-tutorial/master/data/sms.tsv"
DATA_PATH = os.path.join(BASE_DIR, "app", "training", "dataset", "email_spam.tsv")

def download_data():
    if not os.path.exists(DATA_PATH):
        print("Downloading spam dataset...")
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        urllib.request.urlretrieve(DATA_URL, DATA_PATH)
        print("Download complete.")

def train():
    download_data()
    print("Loading data...")
    # The dataset has two columns: label and message
    df = pd.read_csv(DATA_PATH, sep='\t', header=None, names=['label', 'message'])
    
    # Convert labels: 'spam' -> 1, 'ham' -> 0
    df['is_spam'] = df['label'].map({'spam': 1, 'ham': 0})

    X = df['message']
    y = df['is_spam']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training TF-IDF + Naive Bayes pipeline...")
    model = make_pipeline(
        TfidfVectorizer(stop_words='english', max_features=5000, ngram_range=(1, 2)),
        MultinomialNB()
    )

    model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = model.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Phishing/Spam']))

    print(f"Saving model to {MODEL_PATH}...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print("Training complete! Model saved.")

if __name__ == "__main__":
    train()
