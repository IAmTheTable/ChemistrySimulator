"""Equation balancer with formula parser and matrix-based balancing.

Parses chemical formulas into element counts and balances chemical equations
using SVD-based null space computation.
"""

from __future__ import annotations

import re
from math import gcd
from functools import reduce

import numpy as np


def parse_formula(formula: str) -> dict[str, int]:
    """Parse a chemical formula into a dict mapping element symbols to counts.

    Handles:
    - Simple formulas: H2O -> {"H": 2, "O": 1}
    - Multi-character elements: Fe2O3 -> {"Fe": 2, "O": 3}
    - Parentheses with subscripts: Ca(OH)2 -> {"Ca": 1, "O": 2, "H": 2}
    """
    tokens = _tokenize(formula)
    result, _ = _parse_tokens(tokens, 0)
    return result


def _tokenize(formula: str) -> list[str]:
    """Tokenize a formula into elements, numbers, and parentheses."""
    tokens: list[str] = []
    i = 0
    while i < len(formula):
        if formula[i] == "(":
            tokens.append("(")
            i += 1
        elif formula[i] == ")":
            tokens.append(")")
            i += 1
        elif formula[i].isupper():
            # Element symbol: uppercase letter optionally followed by lowercase
            symbol = formula[i]
            i += 1
            while i < len(formula) and formula[i].islower():
                symbol += formula[i]
                i += 1
            tokens.append(symbol)
        elif formula[i].isdigit():
            # Number (subscript)
            num_str = ""
            while i < len(formula) and formula[i].isdigit():
                num_str += formula[i]
                i += 1
            tokens.append(num_str)
        else:
            i += 1  # skip unexpected characters
    return tokens


def _parse_tokens(
    tokens: list[str], pos: int
) -> tuple[dict[str, int], int]:
    """Recursively parse tokens into element counts.

    Returns the element dict and the position after parsing.
    """
    counts: dict[str, int] = {}
    i = pos
    while i < len(tokens):
        token = tokens[i]
        if token == "(":
            # Parse the group inside parentheses
            sub_counts, i = _parse_tokens(tokens, i + 1)
            # Check for a multiplier after the closing paren
            if i < len(tokens) and tokens[i].isdigit():
                multiplier = int(tokens[i])
                i += 1
            else:
                multiplier = 1
            for elem, count in sub_counts.items():
                counts[elem] = counts.get(elem, 0) + count * multiplier
        elif token == ")":
            # End of a parenthesized group
            return counts, i + 1
        elif token[0].isupper():
            # Element symbol
            elem = token
            # Check for a subscript number
            if i + 1 < len(tokens) and tokens[i + 1].isdigit():
                num = int(tokens[i + 1])
                i += 2
            else:
                num = 1
                i += 1
            counts[elem] = counts.get(elem, 0) + num
        else:
            i += 1  # skip unexpected tokens

    return counts, i


def balance_equation(
    reactants: list[str], products: list[str]
) -> list[int]:
    """Balance a chemical equation and return integer coefficients.

    Args:
        reactants: List of reactant formula strings.
        products: List of product formula strings.

    Returns:
        List of integer coefficients: [reactant_coeffs..., product_coeffs...].
        Coefficients are the smallest positive integers that balance the equation.
    """
    all_species = reactants + products
    n_species = len(all_species)

    # Parse all formulas
    parsed = [parse_formula(f) for f in all_species]

    # Collect all unique elements
    elements: list[str] = []
    for p in parsed:
        for elem in p:
            if elem not in elements:
                elements.append(elem)

    n_elements = len(elements)

    # Build the composition matrix
    # Each row is an element, each column is a species
    # Reactants are positive, products are negative
    matrix = np.zeros((n_elements, n_species), dtype=float)
    for col_idx, species_counts in enumerate(parsed):
        sign = 1.0 if col_idx < len(reactants) else -1.0
        for elem, count in species_counts.items():
            row_idx = elements.index(elem)
            matrix[row_idx, col_idx] = sign * count

    # Find null space using SVD
    _, s, vt = np.linalg.svd(matrix)

    # The null space vector is the last row of V^T
    # (corresponding to the smallest singular value)
    null_vector = vt[-1, :]

    # Ensure all coefficients are positive
    # If all are negative, flip the sign
    if np.all(null_vector < 0):
        null_vector = -null_vector
    # If mixed signs with majority negative, flip
    if np.sum(null_vector < 0) > np.sum(null_vector > 0):
        null_vector = -null_vector

    # Take absolute values and round to integers
    null_vector = np.abs(null_vector)

    # Scale to get integers: divide by the minimum nonzero value, then round
    min_val = np.min(null_vector[null_vector > 1e-10])
    scaled = null_vector / min_val
    coeffs = np.round(scaled).astype(int)

    # Normalize by GCD to get smallest integers
    overall_gcd = reduce(gcd, coeffs)
    if overall_gcd > 1:
        coeffs = coeffs // overall_gcd

    return coeffs.tolist()
