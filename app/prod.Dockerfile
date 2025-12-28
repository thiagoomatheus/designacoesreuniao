FROM node:20-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Omit --production flag for TypeScript devDependencies
RUN npm ci --legacy-peer-deps
RUN apk add --no-cache openssl

COPY . .
RUN npx prisma generate

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG EVOLUTION_API_URL
ENV EVOLUTION_API_URL=${EVOLUTION_API_URL}
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG AUTH_SECRET
ENV AUTH_SECRET=${AUTH_SECRET}
ARG AUTH_GOOGLE_ID
ENV AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}
ARG AUTH_GOOGLE_SECRET
ENV AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}
ARG AUTH_URL
ENV AUTH_URL=${AUTH_URL}
ARG AUTH_REDIRECT_PROXY_URL
ENV AUTH_REDIRECT_PROXY_URL=${AUTH_REDIRECT_PROXY_URL}
ARG AUTHENTICATION_API_KEY
ENV AUTHENTICATION_API_KEY=${AUTHENTICATION_API_KEY}
ARG SENDGRID_API_KEY
ENV SENDGRID_API_KEY=${SENDGRID_API_KEY}

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
# ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js based on the preferred package manager
RUN npm run build

# Note: It is not necessary to add an intermediate step that does a full copy of `node_modules` here

# Step 2. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app_prod

ENV NODE_ENV=production

RUN npm install -g tsx prisma@5.21.1
RUN apk add --no-cache openssl

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN chown -R nextjs:nodejs /app_prod

USER nextjs

COPY --chown=nextjs:nodejs package.json package-lock.json* ./

RUN npm install tsx prisma@5.21.1 --legacy-peer-deps --save-exact

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder --chown=nextjs:nodejs /app/app/lib/notificacao/ ./notificacao

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/date-fns ./node_modules/date-fns

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/nodemailer ./node_modules/nodemailer
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/nodemailer-sendgrid ./node_modules/nodemailer-sendgrid
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@sendgrid/mail ./node_modules/@sendgrid/mail
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@sendgrid/client ./node_modules/@sendgrid/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@sendgrid/helpers ./node_modules/@sendgrid/helpers

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/request ./node_modules/request
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/form-data ./node_modules/form-data
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/combined-stream ./node_modules/combined-stream
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/delayed-stream ./node_modules/delayed-stream
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/asynckit ./node_modules/asynckit
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/extend ./node_modules/extend
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/json-stringify-safe ./node_modules/json-stringify-safe
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/aws-sign2 ./node_modules/aws-sign2
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/aws4 ./node_modules/aws4
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/caseless ./node_modules/caseless
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/forever-agent ./node_modules/forever-agent
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/http-signature ./node_modules/http-signature
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/is-typedarray ./node_modules/is-typedarray
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/isstream ./node_modules/isstream
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/mime-types ./node_modules/mime-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/mime-db ./node_modules/mime-db
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/oauth-sign ./node_modules/oauth-sign
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/performance-now ./node_modules/performance-now
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/qs ./node_modules/qs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/safe-buffer ./node_modules/safe-buffer
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tunnel-agent ./node_modules/tunnel-agent
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/uuid ./node_modules/uuid
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/har-validator ./node_modules/har-validator
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/har-schema ./node_modules/har-schema
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ajv ./node_modules/ajv
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/fast-deep-equal ./node_modules/fast-deep-equal
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/fast-json-stable-stringify ./node_modules/fast-json-stable-stringify
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/json-schema-traverse ./node_modules/json-schema-traverse
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/uri-js ./node_modules/uri-js
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/punycode ./node_modules/punycode
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/jsprim ./node_modules/jsprim
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/extsprintf ./node_modules/extsprintf
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/json-schema ./node_modules/json-schema
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/verror ./node_modules/verror
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/core-util-is ./node_modules/core-util-is

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tough-cookie ./node_modules/tough-cookie
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/psl ./node_modules/psl
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sshpk ./node_modules/sshpk
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/asn1 ./node_modules/asn1
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/assert-plus ./node_modules/assert-plus
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcrypt-pbkdf ./node_modules/bcrypt-pbkdf
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dashdash ./node_modules/dashdash
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ecc-jsbn ./node_modules/ecc-jsbn
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/getpass ./node_modules/getpass
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/jsbn ./node_modules/jsbn
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/safer-buffer ./node_modules/safer-buffer
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tweetnacl ./node_modules/tweetnacl

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/chalk ./node_modules/chalk
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ansi-styles ./node_modules/ansi-styles
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/color-convert ./node_modules/color-convert
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/color-name ./node_modules/color-name
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/escape-string-regexp ./node_modules/escape-string-regexp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/supports-color ./node_modules/supports-color
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/has-flag ./node_modules/has-flag
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/deepmerge ./node_modules/deepmerge

# Environment variables must be redefined at run time
ARG ASAAS_LINK_PAGAMENTO_UNICO
ENV ASAAS_LINK_PAGAMENTO_UNICO=${ASAAS_LINK_PAGAMENTO_UNICO}
ARG ASAAS_LINK_PAGAMENTO_RECORRENTE
ENV ASAAS_LINK_PAGAMENTO_RECORRENTE=${ASAAS_LINK_PAGAMENTO_RECORRENTE}
ARG EVOLUTION_API_URL
ENV EVOLUTION_API_URL=${EVOLUTION_API_URL}
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG AUTH_SECRET
ENV AUTH_SECRET=${AUTH_SECRET}
ARG AUTH_GOOGLE_ID
ENV AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}
ARG AUTH_GOOGLE_SECRET
ENV AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}
ARG AUTH_URL
ENV AUTH_URL=${AUTH_URL}
ARG AUTH_REDIRECT_PROXY_URL
ENV AUTH_REDIRECT_PROXY_URL=${AUTH_REDIRECT_PROXY_URL}
ARG AUTHENTICATION_API_KEY
ENV AUTHENTICATION_API_KEY=${AUTHENTICATION_API_KEY}
ARG SENDGRID_API_KEY
ENV SENDGRID_API_KEY=${SENDGRID_API_KEY}

# Uncomment the following line to disable telemetry at run time
# ENV NEXT_TELEMETRY_DISABLED 1

# Note: Don't expose ports here, Compose will handle that for us

CMD ["npm", "run", "start:migrate:prod"]