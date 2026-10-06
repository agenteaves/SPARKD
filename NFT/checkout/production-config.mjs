export const MAINNET = Object.freeze({
 cluster:'mainnet-beta', genesis:'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
 tokenProgram:'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
 mint:'BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump',
 collection:'4ARoTdtbC6LzCQ4c8Fk4ZvmheQYE5vAnU5T6Mx3rs5A4',
 seller:'2dFYXBWy1s5kq3gZpZ9m3aQ4VkUDwVbUSnVes5rUXSe6',
});
export const LISTINGS=Object.freeze([
 ['first-spark','special','6WGq2FpB9DCW62by7VGbfSsRyYB6Zg6GixbnfT862zYj'],
 ['secret-identity','special','2LhUSq81EFD4cq8Ed8EnqbaKg1futsr3mW1WwmfohyDG'],
 ['ready-for-takeoff','special','8YKaY1srJoxvCnfrQ34Cp9LkTTRJiZC12tB4KqPGxH4F'],
 ['heroes-dont-look-away','special','A3NNSJtfqdhKxDZopCmxErxppFGpakE5AVZSNmN2d1rn'],
 ['justice-for-tomorrow','special','9V1E13fQqrRHobQi1ezpPLLQ5ktRuEkx1u246727UfDq'],
 ['chasing-the-jeets','winner','QTMZGvehRpBAQjs6uFMyqbJCEdhNhdCihXhRPBEk6D9'],
 ['the-rise-of-sparkd','winner','7frr8Pn7hUtzaSDSypc5eUYCKP632Drz58UahWfXWAWy'],
 ['you-are-different','winner','27oW4rNe4aDhjAeMCW8HbR32PjDvSAhJh9kmTCfRU8Ve'],
 ['bear-knockout','winner','4Z1eNUv5WbKPVeVatPYuAej7NbYA71ezs8F4jgunGUhm'],
].map(([id,category,asset])=>Object.freeze({id,category,asset,seller:MAINNET.seller})));
