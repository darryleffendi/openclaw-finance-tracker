from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from backend.auth import init_oauth
from backend.config import CORS_ORIGINS, PORT, SECRET_KEY
from backend.routes import (
    account_route,
    auth_route,
    bucket_route,
    distribute_route,
    summary_route,
    transaction_route,
)

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.secret_key = SECRET_KEY
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)

init_oauth(app)

app.register_blueprint(auth_route.bp)
app.register_blueprint(transaction_route.bp)
app.register_blueprint(account_route.bp)
app.register_blueprint(bucket_route.bp)
app.register_blueprint(summary_route.bp)
app.register_blueprint(distribute_route.bp)


if __name__ == "__main__":
    app.run(port=PORT, debug=False)
