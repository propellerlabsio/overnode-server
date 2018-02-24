const limits = {
  get: () => ({
    default: 10,
    max: 20,
  }),
  validate: ({ requested, context }) => {
    let validatedLimit;
    const configured = limits.get();
    if (!requested) {
      validatedLimit = configured.default;
    } else if (requested > configured.max) {
      throw new Error(`Please limit '${context}' to no more than  ${configured.max} results.`);
    } else {
      validatedLimit = requested;
    }
    return validatedLimit;
  },
};
export default limits;
