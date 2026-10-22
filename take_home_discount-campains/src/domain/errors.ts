export class DiscountValidationError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`Invalid discount input:\n- ${issues.join('\n- ')}`)
    this.name = 'DiscountValidationError'
    this.issues = issues
  }
}
