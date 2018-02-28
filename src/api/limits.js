const limits = {
  get: () => ({
    default: 10,
    max: 20,
  }),
  validate: ({ requested }) => {
    let validatedLimit;
    const configured = limits.get();
    if (!requested) {
      validatedLimit = configured.default;
    } else if (requested > configured.max) {
      throw new Error(`Unauthorized limit (${requested}). Please set to no more than  ${configured.max}.`);
    } else {
      validatedLimit = requested;
    }
    return validatedLimit;
  },
};
export default limits;
