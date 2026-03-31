"use client";

import Image from "next/image";
import { useState } from "react";

interface CreateConcertFormProps {
  isSubmitting: boolean;
  fieldErrors: Record<string, string>;
  onSubmit: (payload: {
    name: string;
    description: string;
    totalSeats: number;
  }) => Promise<boolean>;
}

export function CreateConcertForm({
  isSubmitting,
  fieldErrors,
  onSubmit,
}: CreateConcertFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalSeats, setTotalSeats] = useState("500");

  return (
    <section className="content-card">
      <h2 className="concert-title">Create</h2>
      <hr className="mt-5" />
      <form
        className="mt-6 grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const isSuccessful = await onSubmit({
            name,
            description,
            totalSeats: Number(totalSeats),
          });

          if (isSuccessful) {
            setName("");
            setDescription("");
            setTotalSeats("500");
          }
        }}
      >
        <div className="form-grid">
          <label className="form-field">
            <span className="field-label">Concert Name</span>
            <input
              className="field-input"
              placeholder="Please input concert name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
          </label>

          <label className="form-field">
            <span className="field-label">Total of seat</span>
            <span className="input-with-icon">
              <input
                className="field-input"
                inputMode="numeric"
                placeholder="500"
                value={totalSeats}
                onChange={(event) => setTotalSeats(event.target.value)}
              />
              <span className="input-trailing-icon">
                <Image src="/icons/input-user.png" alt="" width={24} height={24} />
              </span>
            </span>
            {fieldErrors.totalSeats ? (
              <span className="field-error">{fieldErrors.totalSeats}</span>
            ) : null}
          </label>

          <label className="form-field is-wide">
            <span className="field-label">Description</span>
            <textarea
              className="field-textarea"
              placeholder="Please input description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {fieldErrors.description ? (
              <span className="field-error">{fieldErrors.description}</span>
            ) : null}
          </label>
        </div>

        {fieldErrors.general ? <p className="form-error">{fieldErrors.general}</p> : null}

        <div className="flex justify-end">
          <button className="base-button button-primary" disabled={isSubmitting} type="submit">
            <Image src="/icons/btn-save.png" alt="" width={20} height={20} />
            Save
          </button>
        </div>
      </form>
    </section>
  );
}