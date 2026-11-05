FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate

RUN mkdir -p uploads /app/chat-media

EXPOSE 4000

# Migratsiyalar, so'ng buyurtmachilar spravochnigini rasmiy ro'yxatdan to'ldirish
# (xavfsiz va qayta ishga tushirilsa hech narsa o'zgarmaydi; xato bo'lsa ham
# server baribir ishga tushadi).
CMD ["sh", "-c", "npx prisma migrate deploy && (node scripts/seed-certification-bodies.js --apply || echo '[seed] certification bodies: skipped') && node src/app.js"]