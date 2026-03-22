"""Spectroscopy simulation engine.

Generates simulated IR, UV-Vis, and mass spectra for molecules based on
their chemical formula. Uses known functional group frequencies and
fragmentation patterns to produce realistic spectral data.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

from app.engine.equation_balancer import parse_formula


# ---------------------------------------------------------------------------
# Atomic masses for molecular weight calculation
# ---------------------------------------------------------------------------

_ATOMIC_MASSES: dict[str, float] = {
    "H": 1.008, "He": 4.003, "Li": 6.941, "Be": 9.012, "B": 10.81,
    "C": 12.011, "N": 14.007, "O": 15.999, "F": 18.998, "Ne": 20.180,
    "Na": 22.990, "Mg": 24.305, "Al": 26.982, "Si": 28.086, "P": 30.974,
    "S": 32.065, "Cl": 35.453, "Ar": 39.948, "K": 39.098, "Ca": 40.078,
    "Fe": 55.845, "Cu": 63.546, "Zn": 65.38, "Br": 79.904, "Ag": 107.868,
    "I": 126.904, "Au": 196.967, "Mn": 54.938, "Co": 58.933, "Ni": 58.693,
    "Cr": 51.996, "Ti": 47.867, "V": 50.942, "Ba": 137.327, "Sr": 87.62,
}


def _molecular_weight(elements: dict[str, int]) -> float:
    """Calculate molecular weight from element counts."""
    return sum(_ATOMIC_MASSES.get(el, 12.0) * count for el, count in elements.items())


# ---------------------------------------------------------------------------
# Functional group detection from formula
# ---------------------------------------------------------------------------

def _detect_functional_groups(elements: dict[str, int]) -> list[str]:
    """Infer possible functional groups from the element composition.

    This is a heuristic approach based on element ratios since we only
    have the molecular formula (not the connectivity).
    """
    groups: list[str] = []
    c = elements.get("C", 0)
    h = elements.get("H", 0)
    o = elements.get("O", 0)
    n = elements.get("N", 0)
    cl = elements.get("Cl", 0)
    br = elements.get("Br", 0)
    s = elements.get("S", 0)
    f = elements.get("F", 0)

    # Always have C-H if both C and H present
    if c > 0 and h > 0:
        groups.append("C-H")

    # Alcohol / hydroxyl: has O and H
    if o > 0 and h >= 1:
        if c == 0:
            # Inorganic O-H (water, acids without carbon)
            groups.append("O-H_alcohol")
        elif o == 1 and h >= (2 * c + 1):
            groups.append("O-H_alcohol")
        elif o >= 2:
            groups.append("O-H_acid")

    # Carboxylic acid: 2 O atoms and C
    if o >= 2 and c >= 1:
        groups.append("C=O_acid")

    # Carbonyl: has O and C but not enough H for full saturation
    if o >= 1 and c >= 1 and h < (2 * c + 2):
        groups.append("C=O")

    # Amine: has N and H
    if n > 0 and h > 0:
        groups.append("N-H")

    # C=C: unsaturated (H < 2C+2 for non-ring)
    if c >= 2 and h < (2 * c + 2) and o == 0 and n == 0:
        groups.append("C=C")

    # C-Cl
    if cl > 0:
        groups.append("C-Cl")

    # C-Br
    if br > 0:
        groups.append("C-Br")

    # C-F
    if f > 0:
        groups.append("C-F")

    # S=O (sulfate, sulfoxide)
    if s > 0 and o > 0:
        groups.append("S=O")

    # C-O ether or alcohol
    if c > 0 and o > 0:
        groups.append("C-O")

    return groups


# ---------------------------------------------------------------------------
# IR spectrum peak data for functional groups
# ---------------------------------------------------------------------------

_IR_GROUP_PEAKS: dict[str, list[dict]] = {
    "O-H_alcohol": [
        {"center": 3400, "width": 200, "intensity": 0.35, "label": "O-H stretch (alcohol)"},
    ],
    "O-H_acid": [
        {"center": 3000, "width": 400, "intensity": 0.25, "label": "O-H stretch (acid, broad)"},
    ],
    "N-H": [
        {"center": 3400, "width": 100, "intensity": 0.40, "label": "N-H stretch"},
        {"center": 1600, "width": 40, "intensity": 0.55, "label": "N-H bend"},
    ],
    "C-H": [
        {"center": 2950, "width": 80, "intensity": 0.50, "label": "C-H stretch"},
        {"center": 1450, "width": 30, "intensity": 0.65, "label": "C-H bend"},
    ],
    "C=O": [
        {"center": 1715, "width": 30, "intensity": 0.15, "label": "C=O stretch"},
    ],
    "C=O_acid": [
        {"center": 1710, "width": 35, "intensity": 0.12, "label": "C=O stretch (acid)"},
    ],
    "C=C": [
        {"center": 1650, "width": 30, "intensity": 0.55, "label": "C=C stretch"},
    ],
    "C-O": [
        {"center": 1100, "width": 50, "intensity": 0.45, "label": "C-O stretch"},
    ],
    "C-Cl": [
        {"center": 750, "width": 40, "intensity": 0.40, "label": "C-Cl stretch"},
    ],
    "C-Br": [
        {"center": 650, "width": 40, "intensity": 0.40, "label": "C-Br stretch"},
    ],
    "C-F": [
        {"center": 1100, "width": 60, "intensity": 0.30, "label": "C-F stretch"},
    ],
    "S=O": [
        {"center": 1300, "width": 40, "intensity": 0.30, "label": "S=O stretch"},
        {"center": 1150, "width": 40, "intensity": 0.35, "label": "S=O stretch (sym)"},
    ],
}


def _gaussian(x: float, center: float, width: float, intensity: float) -> float:
    """Gaussian peak shape."""
    return intensity * math.exp(-0.5 * ((x - center) / width) ** 2)


# ---------------------------------------------------------------------------
# SpectroscopyEngine
# ---------------------------------------------------------------------------

class SpectroscopyEngine:
    """Generate simulated spectra for molecules given their formula."""

    def __init__(self, seed: int | None = None):
        self._rng = random.Random(seed)

    def generate_ir_spectrum(self, formula: str) -> dict:
        """Generate a simulated IR spectrum with characteristic peaks.

        Returns:
            dict with keys:
                x: list of wavenumbers (4000 -> 400 cm^-1)
                y: list of transmittance values (0-1)
                peaks: list of {position, label} dicts
                x_label: str
                y_label: str
        """
        elements = parse_formula(formula)
        groups = _detect_functional_groups(elements)

        # Build x axis: 4000 to 400 cm^-1
        n_points = 1800
        x_vals = [4000 - i * 2 for i in range(n_points)]

        # Start with baseline transmittance near 1.0
        y_vals = [0.95 + self._rng.uniform(-0.01, 0.01) for _ in range(n_points)]

        peaks: list[dict] = []
        seen_labels: set[str] = set()

        for group in groups:
            group_peaks = _IR_GROUP_PEAKS.get(group, [])
            for peak_info in group_peaks:
                center = peak_info["center"] + self._rng.uniform(-10, 10)
                width = peak_info["width"]
                intensity = peak_info["intensity"]
                label = peak_info["label"]

                # Subtract gaussian from transmittance (absorption dips)
                for i, wn in enumerate(x_vals):
                    absorption = _gaussian(wn, center, width, intensity)
                    y_vals[i] -= absorption

                if label not in seen_labels:
                    peaks.append({"position": round(center), "label": label})
                    seen_labels.add(label)

        # Clamp values
        y_vals = [max(0.0, min(1.0, v)) for v in y_vals]

        return {
            "x": x_vals,
            "y": y_vals,
            "peaks": peaks,
            "x_label": "Wavenumber (cm\u207b\u00b9)",
            "y_label": "Transmittance",
        }

    def generate_uv_vis_spectrum(self, formula: str) -> dict:
        """Generate a simulated UV-Vis spectrum.

        Returns:
            dict with keys:
                x: list of wavelengths (190-800 nm)
                y: list of absorbance values
                lambda_max: float (wavelength of maximum absorption)
                peaks: list of {position, label} dicts
                x_label: str
                y_label: str
        """
        elements = parse_formula(formula)
        c = elements.get("C", 0)
        o = elements.get("O", 0)
        n = elements.get("N", 0)
        h = elements.get("H", 0)
        cl = elements.get("Cl", 0)
        br = elements.get("Br", 0)
        s = elements.get("S", 0)

        # Build x axis: 190 to 800 nm
        n_points = 610
        x_vals = [190 + i for i in range(n_points)]

        # Baseline
        y_vals = [0.02 + self._rng.uniform(-0.005, 0.005) for _ in range(n_points)]

        absorption_peaks: list[dict] = []

        # Determine absorption bands based on structural features
        if c >= 6 and h >= 6:
            # Aromatic: pi->pi* around 255 nm, weak n->pi* if substituted
            absorption_peaks.append({"center": 255, "width": 15, "intensity": 1.2, "label": "pi->pi* (aromatic)"})
            if o > 0 or n > 0:
                absorption_peaks.append({"center": 280, "width": 12, "intensity": 0.4, "label": "n->pi*"})

        if c >= 2 and h < (2 * c + 2) and o == 0 and n == 0:
            # Simple unsaturated: pi->pi*
            absorption_peaks.append({"center": 220, "width": 12, "intensity": 0.8, "label": "pi->pi* (C=C)"})

        if o > 0 and c > 0 and h < (2 * c + 2):
            # Carbonyl n->pi*
            absorption_peaks.append({"center": 280, "width": 15, "intensity": 0.3, "label": "n->pi* (C=O)"})

        if n > 0:
            absorption_peaks.append({"center": 230, "width": 12, "intensity": 0.5, "label": "n->pi* (N)"})

        if br > 0 or cl > 0:
            absorption_peaks.append({"center": 210, "width": 10, "intensity": 0.6, "label": "n->sigma*"})

        if s > 0:
            absorption_peaks.append({"center": 240, "width": 15, "intensity": 0.5, "label": "n->pi* (S)"})

        # If no chromophores, add a generic weak UV absorption
        if not absorption_peaks:
            absorption_peaks.append({"center": 200, "width": 10, "intensity": 0.4, "label": "sigma->sigma*"})

        peak_labels: list[dict] = []
        max_abs = 0.0
        lambda_max = 200.0

        for peak_info in absorption_peaks:
            center = peak_info["center"] + self._rng.uniform(-3, 3)
            width = peak_info["width"]
            intensity = peak_info["intensity"]
            label = peak_info["label"]

            for i, wl in enumerate(x_vals):
                absorption = _gaussian(wl, center, width, intensity)
                y_vals[i] += absorption

            peak_labels.append({"position": round(center), "label": label})

        # Find lambda_max
        for i, v in enumerate(y_vals):
            if v > max_abs:
                max_abs = v
                lambda_max = x_vals[i]

        return {
            "x": x_vals,
            "y": y_vals,
            "lambda_max": lambda_max,
            "peaks": peak_labels,
            "x_label": "Wavelength (nm)",
            "y_label": "Absorbance",
        }

    def generate_mass_spectrum(self, formula: str) -> dict:
        """Generate a simulated mass spectrum.

        Returns:
            dict with keys:
                x: list of m/z values
                y: list of relative intensity values (0-100)
                molecular_ion: float (M+ peak position)
                peaks: list of {position, label} dicts
                x_label: str
                y_label: str
        """
        elements = parse_formula(formula)
        mw = _molecular_weight(elements)
        mw_int = round(mw)

        # Build x axis: 0 to mw + 20
        max_mz = mw_int + 20
        x_vals = list(range(0, max_mz + 1))
        y_vals = [0.0] * len(x_vals)

        peaks: list[dict] = []

        # Molecular ion peak (M+)
        if mw_int < len(y_vals):
            y_vals[mw_int] = 80 + self._rng.uniform(-10, 20)
            peaks.append({"position": mw_int, "label": f"M+ ({mw_int})"})

        # M+1 peak (isotope)
        if mw_int + 1 < len(y_vals):
            c_count = elements.get("C", 0)
            m_plus_1 = c_count * 1.1  # ~1.1% per carbon
            y_vals[mw_int + 1] = min(m_plus_1, 30)

        # Common fragment peaks
        fragments = self._generate_fragments(elements, mw_int)
        base_peak_mz = mw_int
        base_peak_intensity = y_vals[mw_int] if mw_int < len(y_vals) else 0

        for frag_mz, frag_intensity, frag_label in fragments:
            if 0 < frag_mz < len(y_vals):
                y_vals[frag_mz] = frag_intensity
                peaks.append({"position": frag_mz, "label": frag_label})
                if frag_intensity > base_peak_intensity:
                    base_peak_intensity = frag_intensity
                    base_peak_mz = frag_mz

        # Normalize to base peak = 100
        if base_peak_intensity > 0:
            scale = 100.0 / base_peak_intensity
            y_vals = [v * scale for v in y_vals]
            for p in peaks:
                pass  # positions don't change

        # Add minor noise peaks
        for i in range(len(y_vals)):
            if y_vals[i] < 1.0 and self._rng.random() < 0.05:
                y_vals[i] = self._rng.uniform(0.5, 3.0)

        return {
            "x": x_vals,
            "y": y_vals,
            "molecular_ion": mw_int,
            "peaks": peaks,
            "x_label": "m/z",
            "y_label": "Relative Intensity (%)",
        }

    def _generate_fragments(
        self, elements: dict[str, int], mw: int
    ) -> list[tuple[int, float, str]]:
        """Generate common fragmentation peaks based on element composition.

        Returns list of (m/z, relative_intensity, label) tuples.
        """
        fragments: list[tuple[int, float, str]] = []
        c = elements.get("C", 0)
        h = elements.get("H", 0)
        o = elements.get("O", 0)
        n = elements.get("N", 0)
        cl = elements.get("Cl", 0)
        br = elements.get("Br", 0)

        # Loss of H (M-1)
        if h > 0 and mw > 1:
            fragments.append((mw - 1, 15 + self._rng.uniform(0, 15), "M-1"))

        # Loss of water (M-18) if O-H present
        if o > 0 and h >= 2 and mw > 18:
            fragments.append((mw - 18, 30 + self._rng.uniform(0, 30), "M-H2O"))

        # Loss of CO (M-28) if carbonyl
        if c > 0 and o > 0 and mw > 28:
            fragments.append((mw - 28, 20 + self._rng.uniform(0, 25), "M-CO"))

        # Loss of CH3 (M-15)
        if c >= 2 and h >= 3 and mw > 15:
            fragments.append((mw - 15, 40 + self._rng.uniform(0, 30), "M-CH3"))

        # Loss of Cl (M-35/M-37)
        if cl > 0 and mw > 35:
            fragments.append((mw - 35, 30 + self._rng.uniform(0, 20), "M-Cl"))

        # Loss of Br (M-79)
        if br > 0 and mw > 79:
            fragments.append((mw - 79, 30 + self._rng.uniform(0, 20), "M-Br"))

        # Loss of NH2 (M-16)
        if n > 0 and h >= 2 and mw > 16:
            fragments.append((mw - 16, 20 + self._rng.uniform(0, 15), "M-NH2"))

        # CH3+ or similar small cation
        if c >= 1 and h >= 3:
            fragments.append((15, 25 + self._rng.uniform(0, 30), "CH3+"))

        # OH+
        if o > 0 and h > 0:
            fragments.append((17, 10 + self._rng.uniform(0, 15), "OH+"))

        # CO+
        if c > 0 and o > 0:
            fragments.append((28, 15 + self._rng.uniform(0, 20), "CO+"))

        # C2H5+
        if c >= 2 and h >= 5:
            fragments.append((29, 20 + self._rng.uniform(0, 20), "C2H5+ / CHO+"))

        return fragments
