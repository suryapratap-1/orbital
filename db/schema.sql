-- ORBITAL Pioneer registry
CREATE TABLE IF NOT EXISTS pioneers (
  id           BIGSERIAL PRIMARY KEY,
  signal_id    TEXT        NOT NULL UNIQUE,
  full_name    TEXT        NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 80),
  email        TEXT        NOT NULL,
  country      TEXT        NOT NULL CHECK (char_length(country) BETWEEN 2 AND 60),
  role         TEXT        NOT NULL CHECK (role IN ('observer','student','engineer','scientist','educator','other')),
  message      TEXT        CHECK (char_length(message) <= 140),
  updates      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pioneers_email_lower_idx ON pioneers (lower(email));
