import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { submitVehicleEnquiry } from '../api';

interface VehicleEnquiryFormProps {
  vehicleSlug: string;
  vehicleLabel: string;
  onClose: () => void;
}

interface FormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

const validate = (values: FormValues): FormErrors => {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Please enter your name.';
  }

  if (!values.address.trim()) {
    errors.address = 'Please enter your full address.';
  }

  return errors;
};

export function VehicleEnquiryForm({
  vehicleSlug,
  vehicleLabel,
  onClose,
}: VehicleEnquiryFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await submitVehicleEnquiry({
        vehicleSlug,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        fullAddress: values.address.trim(),
      });
      setIsSubmitted(true);
      onClose();
    } catch {
      setSubmissionError('We could not submit your enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="vehicle-enquiry-card"
      id="vehicle-enquiry-form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-enquiry-title"
    >
      <div className="vehicle-enquiry-card-heading">
        <div>
          <h2 id="vehicle-enquiry-title">Enquire about this vehicle</h2>
          <p>Fill in your details and we’ll be in touch soon.</p>
        </div>
        <button
          className="vehicle-enquiry-card-close"
          type="button"
          aria-label="Close enquiry form"
          onClick={onClose}
          autoFocus
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <form className="vehicle-enquiry-form" onSubmit={handleSubmit} noValidate>
        <div className="vehicle-enquiry-form-body">
          <div className="vehicle-enquiry-field">
            <label htmlFor="selected-car">Selected car</label>
            <input id="selected-car" name="selectedCar" type="text" value={vehicleLabel} readOnly />
          </div>

          <div className="vehicle-enquiry-field">
            <label htmlFor="enquiry-name">Name *</label>
            <input
              id="enquiry-name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'enquiry-name-error' : undefined}
            />
            {errors.name ? (
              <span className="vehicle-enquiry-error" id="enquiry-name-error" role="alert">
                {errors.name}
              </span>
            ) : null}
          </div>

          <div className="vehicle-enquiry-field">
            <label htmlFor="enquiry-phone">Phone</label>
            <input
              id="enquiry-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => updateValue('phone', event.target.value)}
            />
          </div>

          <div className="vehicle-enquiry-field">
            <label htmlFor="enquiry-email">Email</label>
            <input
              id="enquiry-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
            />
          </div>

          <div className="vehicle-enquiry-field">
            <label htmlFor="enquiry-address">Full Address *</label>
            <textarea
              id="enquiry-address"
              name="address"
              autoComplete="street-address"
              rows={3}
              value={values.address}
              onChange={(event) => updateValue('address', event.target.value)}
              required
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? 'enquiry-address-error' : undefined}
            />
            {errors.address ? (
              <span className="vehicle-enquiry-error" id="enquiry-address-error" role="alert">
                {errors.address}
              </span>
            ) : null}
          </div>
        </div>

        {submissionError ? (
          <p className="vehicle-enquiry-submit-message is-error" role="alert">
            {submissionError}
          </p>
        ) : null}
        {isSubmitted ? (
          <p className="vehicle-enquiry-submit-message is-success" role="status">
            Thanks — your enquiry has been sent. We’ll be in touch soon.
          </p>
        ) : (
          <button className="vehicle-enquiry-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending enquiry…' : 'Request a callback'}
          </button>
        )}
      </form>
    </section>
  );
}
