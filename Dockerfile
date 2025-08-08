FROM python:3.11-slim

WORKDIR /app

# Copy dependency file and install dependencies
COPY requirements.txt ./
COPY flask_app ./flask_app
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port provided by the platform
EXPOSE $PORT

# Run the application using gunicorn
CMD ["gunicorn", "flask_app.app:create_app()", "--bind", "0.0.0.0:$PORT"]
