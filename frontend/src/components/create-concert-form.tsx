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
  onClearFieldError?: (field: string) => void;
}

export function CreateConcertForm({
  isSubmitting,
  fieldErrors,
  onSubmit,
  onClearFieldError,
}: CreateConcertFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalSeats, setTotalSeats] = useState("500");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errors = { ...localErrors, ...fieldErrors };

  function validateLocally(): Record<string, string> {
    const result: Record<string, string> = {};
    if (!name.trim()) result.name = "Concert name is required";
    else if (name.trim().length < 2) result.name = "Concert name must be at least 2 characters";
    if (!description.trim()) result.description = "Description is required";
    else if (description.trim().length < 10) result.description = "Description must be at least 10 characters";
    const seats = Number(totalSeats);
    if (!totalSeats.trim() || isNaN(seats)) result.totalSeats = "Total seats must be a number";
    else if (!Number.isInteger(seats) || seats < 1) result.totalSeats = "Total seats must be at least 1";
    return result;
  }

  function clearField(field: string) {
    setLocalErrors((prev) => { const { [field]: _, ...rest } = prev; return rest; });
    onClearFieldError?.(field);
  }

  return (
    <section className="content-card">
      <h2 className="concert-title">Create</h2>
      <hr className="mt-5" />
      <form
        className="mt-6 grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const validationErrors = validateLocally();
          if (Object.keys(validationErrors).length > 0) {
            setLocalErrors(validationErrors);
            return;
          }
          setLocalErrors({});
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
              className={`field-input${errors.name ? " is-invalid" : ""}`}
              placeholder="Please input concert name"
              value={name}
              onChange={(event) => { setName(event.target.value); clearField("name"); }}
            />
            {errors.name ? <span className="field-error">{errors.name}</span> : null}
          </label>

          <label className="form-field">
            <span className="field-label">Total of seat</span>
            <span className="input-with-icon">
              <input
                className={`field-input${errors.totalSeats ? " is-invalid" : ""}`}
                inputMode="numeric"
                placeholder="500"
                value={totalSeats}
                onChange={(event) => { setTotalSeats(event.target.value); clearField("totalSeats"); }}
              />
              <span className="input-trailing-icon">
                <Image src="/icons/input-user.png" alt="" width={24} height={24} />
              </span>
            </span>
            {errors.totalSeats ? (
              <span className="field-error">{errors.totalSeats}</span>
            ) : null}
          </label>

          <label className="form-field is-wide">
            <span className="field-label">Description</span>
            <textarea
              className={`field-textarea${errors.description ? " is-invalid" : ""}`}
              placeholder="Please input description"
              value={description}
              onChange={(event) => { setDescription(event.target.value); clearField("description"); }}
            />
            {errors.description ? (
              <span className="field-error">{errors.description}</span>
            ) : null}
          </label>
        </div>

        {errors.general ? <p className="form-error">{errors.general}</p> : null}

        <div className="flex justify-end">
          <button className="base-button button-primary" disabled={isSubmitting} type="submit">
            <Image src="/icons/btn-save.png" alt="" width={20} height={20} />
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}