"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

const TOPICS = ["Ремонт под ключ", "Дизайн-проект", "Комплектация", "Пока не знаю"] as const;

type ContactFormProps = {
  initialMessage?: string;
};

type Errors = Partial<Record<"name" | "contact" | "consent", string>>;

const PHONE_RE = /^\+?[\d\s()-]{10,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm({ initialMessage = "" }: ContactFormProps) {
  const id = useId();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[0]);
  const [message, setMessage] = useState(initialMessage);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Как к вам обращаться?";
    const value = contact.trim();
    if (!PHONE_RE.test(value) && !EMAIL_RE.test(value)) next.contact = "Укажите телефон или e-mail, чтобы мы могли ответить.";
    if (!consent) next.consent = "Нужно согласие на обработку данных.";
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = event.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="contact-form contact-form--sent" role="status">
        <p className="section-label">Заявка принята</p>
        <h2>Спасибо, {name.trim()}!</h2>
        <p>Свяжемся с вами в течение рабочего дня, чтобы договориться о выезде на объект.</p>
        <button className="button button--secondary" type="button" onClick={() => { setSent(false); setMessage(""); }}>
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" noValidate onSubmit={handleSubmit} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="contact-form__title">Расскажите о задаче</h2>

      <div className="contact-form__field">
        <label htmlFor={`${id}-name`}>Имя</label>
        <input
          id={`${id}-name`} name="name" autoComplete="name" value={name}
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined}
          onChange={(event) => setName(event.target.value)}
        />
        {errors.name && <p className="field-error" id={`${id}-name-error`}>{errors.name}</p>}
      </div>

      <div className="contact-form__field">
        <label htmlFor={`${id}-contact`}>Телефон или e-mail</label>
        <input
          id={`${id}-contact`} name="contact" autoComplete="tel" inputMode="email" value={contact}
          aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? `${id}-contact-error` : undefined}
          onChange={(event) => setContact(event.target.value)}
        />
        {errors.contact && <p className="field-error" id={`${id}-contact-error`}>{errors.contact}</p>}
      </div>

      <fieldset className="contact-form__field contact-form__topics">
        <legend>Что нужно</legend>
        <div>
          {TOPICS.map((item) => (
            <label key={item}>
              <input type="radio" name="topic" value={item} checked={topic === item} onChange={() => setTopic(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="contact-form__field">
        <label htmlFor={`${id}-message`}>Комментарий <span>необязательно</span></label>
        <textarea id={`${id}-message`} name="message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
      </div>

      <div className="contact-form__field contact-form__consent">
        <label>
          <input
            type="checkbox" checked={consent} aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>Согласен на обработку персональных данных для ответа на заявку</span>
        </label>
        {errors.consent && <p className="field-error" id={`${id}-consent-error`}>{errors.consent}</p>}
      </div>

      <button className="button button--primary contact-form__submit" type="submit">Отправить заявку</button>
      <p className="contact-form__note">Демо-проект портфолио: форма проверяет данные, но заявки никуда не отправляются.</p>
    </form>
  );
}
