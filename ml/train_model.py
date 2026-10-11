
from pathlib import Path
import csv

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib


# Find files relative to this script
ML_DIR = Path(__file__).resolve().parent
DATASET_PATH = ML_DIR / "complaints.csv"
MODEL_PATH = ML_DIR / "complaint_classifier.joblib"


def load_dataset():
    texts = []
    categories = []

    with DATASET_PATH.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            texts.append(row["text"].strip())
            categories.append(row["category"].strip())

    return texts, categories


def main():
    texts, categories = load_dataset()

    print(f"Total complaint examples: {len(texts)}")
    print(f"Categories: {sorted(set(categories))}")

    # Keep some examples aside for evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        texts,
        categories,
        test_size=0.25,
        random_state=42,
        stratify=categories,
    )

    # TF-IDF converts text into numerical features.
    # Logistic Regression learns patterns to predict categories.
    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
        ("classifier", LogisticRegression(max_iter=1000)),
    ])

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("\n--- Model Evaluation ---")
    print(f"Test accuracy: {accuracy_score(y_test, predictions):.2%}")
    print("\nClassification report:")
    print(classification_report(y_test, predictions, zero_division=0))

    # Train the final model on all available examples for later use
    model.fit(texts, categories)
    joblib.dump(model, MODEL_PATH)

    print(f"\nTrained model saved to: {MODEL_PATH}")

    # Try a few example complaints
    examples = [
        "The Wi-Fi is not working in my classroom",
        "The hostel bathroom is dirty",
        "The college bus arrived late",
        "Someone stole my bag",
    ]

    print("\n--- Sample Predictions ---")
    for complaint in examples:
        prediction = model.predict([complaint])[0]
        print(f"{complaint} -> {prediction}")


if __name__ == "__main__":
    main()
