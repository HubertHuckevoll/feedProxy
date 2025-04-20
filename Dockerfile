FROM node:22-slim
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Default port (override with -e PORT=...)
ENV PORT=65432

# Expose application port
EXPOSE ${PORT}

# Start the app with the port argument
ENTRYPOINT ["sh", "-c", "exec node app.js \"$PORT\""]
