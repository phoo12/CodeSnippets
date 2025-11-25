# Stage 1: Build the Next.js application
#  ပြင်ဆင်ရန်: alpine အစား node:20 ကို သုံးခြင်း (ပိုမိုတည်ငြိမ်သော OS)
FROM node:20 AS builder 

WORKDIR /app

# Package.json နှင့် package-lock.json ကို ကူးယူခြင်း
COPY package.json package-lock.json ./

# Dependencies များကို Install လုပ်ပါ
# --legacy-peer-deps ကို ပြန်ဖယ်လိုက်ပါ သို့မဟုတ် ထားခဲ့ပါ။ (alpine မဟုတ်တော့ရင် မလိုအပ်တော့ပါ)
RUN npm install

# Source code အားလုံးကို ကူးယူခြင်း
COPY . .

# Next.js ကို Production အတွက် Build လုပ်ခြင်း
RUN npm run build

# Stage 2: Production Server (Final Image)
#  ပြင်ဆင်ရန်: runner stage ကို node:20-slim သို့ ပြောင်းခြင်း (Final Image ကို သေးစေရန်)
FROM node:20-slim AS runner

WORKDIR /app

ENV NEXT_PUBLIC_API_URL="http://backend:8000" 

# Production dependencies များသာ install လုပ်ပါ
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

# Build လုပ်ထားသော files များကို ကူးယူခြင်း
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# Next.js Server ကို စတင်ပါ
CMD ["npm", "start"]