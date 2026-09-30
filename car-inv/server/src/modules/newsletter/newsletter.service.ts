import type { NewsletterSubscriptionInput } from './newsletter.schema.js';
import { NewsletterRepository } from './newsletter.repository.js';

export class NewsletterService {
  public constructor(private readonly repository: NewsletterRepository) {}

  public subscribe(input: NewsletterSubscriptionInput) {
    return this.repository.subscribe(input.email.toLowerCase());
  }

  public list() {
    return this.repository.list();
  }
}
