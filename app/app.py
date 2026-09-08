from flask import Flask, render_template
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


app = Flask(
    __name__,
    template_folder=BASE_DIR / "templates",
    static_folder=BASE_DIR / "static"
)


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)