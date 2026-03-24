"""Molecular geometry optimizer using RDKit.

Optimizes molecular geometry and returns bond lengths, angles,
geometry classification, VSEPR analysis, hybridization, polarity,
and symmetry information.
"""

from __future__ import annotations

import math

from rdkit import Chem
from rdkit.Chem import AllChem, rdMolTransforms, Descriptors

from app.engine.rdkit_utils import prepare_molecule
from app.engine.structure_generator import FORMULA_TO_SMILES

# ---------------------------------------------------------------------------
# Electronegativity table (Pauling scale)
# ---------------------------------------------------------------------------

ELECTRONEGATIVITIES: dict[str, float] = {
    "H": 2.20, "He": 0.00,
    "Li": 0.98, "Be": 1.57, "B": 2.04, "C": 2.55, "N": 3.04, "O": 3.44,
    "F": 3.98, "Ne": 0.00,
    "Na": 0.93, "Mg": 1.31, "Al": 1.61, "Si": 1.90, "P": 2.19, "S": 2.58,
    "Cl": 3.16, "Ar": 0.00,
    "K": 0.82, "Ca": 1.00, "Fe": 1.83, "Cu": 1.90, "Zn": 1.65,
    "Br": 2.96, "I": 2.66, "Se": 2.55, "Te": 2.10, "As": 2.18,
    "Ge": 2.01, "Ga": 1.81, "Sn": 1.96, "Pb": 2.33,
}

# ---------------------------------------------------------------------------
# VSEPR geometry lookup: (bonding_pairs, lone_pairs) -> geometry name
# ---------------------------------------------------------------------------

_VSEPR_TABLE: dict[tuple[int, int], str] = {
    (1, 0): "terminal",
    (1, 1): "terminal",
    (1, 2): "terminal",
    (1, 3): "terminal",
    (2, 0): "linear",
    (2, 1): "bent",
    (2, 2): "bent",
    (2, 3): "linear",
    (3, 0): "trigonal planar",
    (3, 1): "trigonal pyramidal",
    (3, 2): "T-shaped",
    (4, 0): "tetrahedral",
    (4, 1): "seesaw",
    (4, 2): "square planar",
    (5, 0): "trigonal bipyramidal",
    (5, 1): "square pyramidal",
    (6, 0): "octahedral",
}

# ---------------------------------------------------------------------------
# Hybridization map
# ---------------------------------------------------------------------------

_HYB_MAP = {
    Chem.HybridizationType.S: "s",
    Chem.HybridizationType.SP: "sp",
    Chem.HybridizationType.SP2: "sp2",
    Chem.HybridizationType.SP3: "sp3",
    Chem.HybridizationType.SP3D: "sp3d",
    Chem.HybridizationType.SP3D2: "sp3d2",
}


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _classify_geometry(num_atoms: int, num_bonds: int, bond_angles: list[float]) -> str:
    """Classify molecular geometry based on atom count and bond angles.

    Kept as a fallback for overall molecule classification.
    """
    if num_atoms <= 1:
        return "atomic"
    if num_atoms == 2:
        return "linear"

    if not bond_angles:
        return "unknown"

    avg_angle = sum(bond_angles) / len(bond_angles)

    if abs(avg_angle - 180.0) < 10:
        return "linear"
    if abs(avg_angle - 120.0) < 10:
        return "trigonal planar"
    if abs(avg_angle - 109.5) < 8:
        return "tetrahedral"
    if abs(avg_angle - 104.5) < 8:
        return "bent"
    if abs(avg_angle - 107.0) < 6:
        return "trigonal pyramidal"
    if abs(avg_angle - 90.0) < 10:
        return "octahedral"

    if avg_angle < 100:
        return "bent"
    if avg_angle < 115:
        return "tetrahedral"
    if avg_angle < 125:
        return "trigonal planar"
    return "linear"


def _classify_geometry_vsepr(mol: Chem.Mol, atom_idx: int) -> dict:
    """Classify geometry around a specific atom using VSEPR theory.

    Returns a dict with geometry name, bonding pairs, lone pairs,
    and total electron domains.
    """
    atom = mol.GetAtomWithIdx(atom_idx)
    num_bonds = len(atom.GetNeighbors())

    # Use outer-shell (valence) electron count to compute lone pairs.
    # GetNOuterElecs gives the number of electrons in the outermost shell
    # (e.g. O=6, N=5, C=4), which is what VSEPR theory requires.
    pt = Chem.GetPeriodicTable()
    valence_electrons = pt.GetNOuterElecs(atom.GetAtomicNum())

    formal_charge = atom.GetFormalCharge()
    lone_pairs = max(0, (valence_electrons - formal_charge - num_bonds) // 2)

    geometry = _VSEPR_TABLE.get((num_bonds, lone_pairs), "unknown")

    return {
        "atom_index": atom_idx,
        "atom_symbol": atom.GetSymbol(),
        "geometry": geometry,
        "bonding_pairs": num_bonds,
        "lone_pairs": lone_pairs,
        "electron_domains": num_bonds + lone_pairs,
    }


def _get_hybridization(atom: Chem.Atom) -> str:
    """Return the hybridization state string for an atom."""
    return _HYB_MAP.get(atom.GetHybridization(), "unknown")


def _compute_polarity(mol: Chem.Mol, conf: Chem.Conformer) -> dict:
    """Estimate molecular polarity from bond dipole vectors.

    Returns polarity flag, approximate dipole magnitude, and bond
    character classification.
    """
    dipole_vectors: list[tuple[float, float, float]] = []

    for bond in mol.GetBonds():
        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()
        sym_i = mol.GetAtomWithIdx(i).GetSymbol()
        sym_j = mol.GetAtomWithIdx(j).GetSymbol()
        en_i = ELECTRONEGATIVITIES.get(sym_i, 2.5)
        en_j = ELECTRONEGATIVITIES.get(sym_j, 2.5)
        en_diff = abs(en_i - en_j)

        if en_diff < 0.01:
            continue  # perfectly nonpolar bond — skip

        pos_i = conf.GetAtomPosition(i)
        pos_j = conf.GetAtomPosition(j)
        dx = pos_j.x - pos_i.x
        dy = pos_j.y - pos_i.y
        dz = pos_j.z - pos_i.z
        length = math.sqrt(dx * dx + dy * dy + dz * dz)
        if length == 0:
            continue

        # Dipole points from less electronegative to more electronegative
        sign = 1.0 if en_j > en_i else -1.0
        scale = sign * en_diff / length
        dipole_vectors.append((scale * dx, scale * dy, scale * dz))

    total_dx = sum(d[0] for d in dipole_vectors)
    total_dy = sum(d[1] for d in dipole_vectors)
    total_dz = sum(d[2] for d in dipole_vectors)
    dipole_magnitude = math.sqrt(
        total_dx * total_dx + total_dy * total_dy + total_dz * total_dz
    )

    is_polar = dipole_magnitude > 0.3

    # Classify dominant bond character
    max_en_diff = 0.0
    for bond in mol.GetBonds():
        sym_i = mol.GetAtomWithIdx(bond.GetBeginAtomIdx()).GetSymbol()
        sym_j = mol.GetAtomWithIdx(bond.GetEndAtomIdx()).GetSymbol()
        diff = abs(
            ELECTRONEGATIVITIES.get(sym_i, 2.5) - ELECTRONEGATIVITIES.get(sym_j, 2.5)
        )
        if diff > max_en_diff:
            max_en_diff = diff

    if max_en_diff < 0.4:
        bond_character = "nonpolar covalent"
    elif max_en_diff < 1.7:
        bond_character = "polar covalent"
    else:
        bond_character = "ionic"

    return {
        "is_polar": is_polar,
        "dipole_magnitude": round(dipole_magnitude, 3),
        "bond_character": bond_character,
    }


def _detect_symmetry(mol: Chem.Mol) -> dict:
    """Detect basic molecular symmetry properties."""
    num_heavy = sum(1 for a in mol.GetAtoms() if a.GetAtomicNum() != 1)

    atom_types: dict[str, int] = {}
    for atom in mol.GetAtoms():
        sym = atom.GetSymbol()
        atom_types[sym] = atom_types.get(sym, 0) + 1

    # Simple symmetry heuristic: if only 1-2 distinct element types and all
    # peripheral atoms are the same, the molecule is likely symmetric.
    is_symmetric = len(atom_types) <= 2

    return {
        "num_heavy_atoms": num_heavy,
        "atom_composition": atom_types,
        "likely_symmetric": is_symmetric,
    }


# ---------------------------------------------------------------------------
# Main class
# ---------------------------------------------------------------------------


class GeometryOptimizer:
    """Optimize geometry and extract geometric properties."""

    def optimize(self, smiles: str) -> dict:
        """Optimize geometry and return comprehensive geometric data.

        Args:
            smiles: A SMILES string for the molecule.

        Returns:
            Dictionary with bond_lengths, bond_angles, dihedral_angles,
            geometry, vsepr, hybridization, polarity, symmetry,
            energy, and structural descriptors.
        """
        mol = prepare_molecule(smiles)

        # Force-field energy from the already-optimized conformer
        energy = 0.0
        try:
            ff = AllChem.MMFFGetMoleculeForceField(
                mol, AllChem.MMFFGetMoleculeProperties(mol)
            )
            if ff is not None:
                energy = ff.CalcEnergy()
        except Exception:
            pass

        conf = mol.GetConformer()

        # ---- Bond lengths ---------------------------------------------------
        bond_lengths: list[dict] = []
        for bond in mol.GetBonds():
            i = bond.GetBeginAtomIdx()
            j = bond.GetEndAtomIdx()
            length = rdMolTransforms.GetBondLength(conf, i, j)
            sym_i = mol.GetAtomWithIdx(i).GetSymbol()
            sym_j = mol.GetAtomWithIdx(j).GetSymbol()
            bond_lengths.append(
                {
                    "atom1_index": i,
                    "atom2_index": j,
                    "atom1_symbol": sym_i,
                    "atom2_symbol": sym_j,
                    "length_angstrom": round(length, 4),
                }
            )

        # ---- Bond angles ----------------------------------------------------
        bond_angles: list[dict] = []
        heavy_angles: list[float] = []
        for atom in mol.GetAtoms():
            neighbors = [n.GetIdx() for n in atom.GetNeighbors()]
            if len(neighbors) < 2:
                continue
            for ni in range(len(neighbors)):
                for nj in range(ni + 1, len(neighbors)):
                    try:
                        angle = rdMolTransforms.GetAngleDeg(
                            conf, neighbors[ni], atom.GetIdx(), neighbors[nj]
                        )
                        sym_a = mol.GetAtomWithIdx(neighbors[ni]).GetSymbol()
                        sym_b = atom.GetSymbol()
                        sym_c = mol.GetAtomWithIdx(neighbors[nj]).GetSymbol()
                        bond_angles.append(
                            {
                                "atom1_index": neighbors[ni],
                                "center_index": atom.GetIdx(),
                                "atom2_index": neighbors[nj],
                                "atoms": f"{sym_a}-{sym_b}-{sym_c}",
                                "angle_degrees": round(angle, 2),
                            }
                        )
                        if atom.GetAtomicNum() != 1:
                            heavy_angles.append(angle)
                    except Exception:
                        pass

        # ---- Dihedral angles -------------------------------------------------
        dihedral_angles: list[dict] = []
        for bond in mol.GetBonds():
            if bond.IsInRing():
                continue
            i = bond.GetBeginAtomIdx()
            j = bond.GetEndAtomIdx()
            neighbors_i = [
                n.GetIdx()
                for n in mol.GetAtomWithIdx(i).GetNeighbors()
                if n.GetIdx() != j
            ]
            neighbors_j = [
                n.GetIdx()
                for n in mol.GetAtomWithIdx(j).GetNeighbors()
                if n.GetIdx() != i
            ]
            if neighbors_i and neighbors_j:
                try:
                    dihedral = rdMolTransforms.GetDihedralDeg(
                        conf, neighbors_i[0], i, j, neighbors_j[0]
                    )
                    dihedral_angles.append(
                        {
                            "atom_indices": [neighbors_i[0], i, j, neighbors_j[0]],
                            "dihedral_degrees": round(dihedral, 2),
                        }
                    )
                except Exception:
                    pass

        # ---- Overall geometry (legacy classifier) ----------------------------
        num_total_atoms = mol.GetNumAtoms()
        all_angle_values = [a["angle_degrees"] for a in bond_angles]
        classification_angles = heavy_angles if heavy_angles else all_angle_values
        overall_geometry = _classify_geometry(
            num_total_atoms, mol.GetNumBonds(), classification_angles
        )

        # ---- VSEPR per non-hydrogen atom ------------------------------------
        vsepr_data: list[dict] = []
        for atom in mol.GetAtoms():
            if atom.GetAtomicNum() == 1:
                continue
            vsepr_data.append(_classify_geometry_vsepr(mol, atom.GetIdx()))

        # If there is exactly one heavy atom, use its VSEPR as the overall
        # geometry label (more accurate than angle-based classifier).
        if len(vsepr_data) == 1:
            overall_geometry = vsepr_data[0]["geometry"]

        # ---- Hybridization per non-hydrogen atom ----------------------------
        hybridization_data: list[dict] = []
        for atom in mol.GetAtoms():
            if atom.GetAtomicNum() == 1:
                continue
            hybridization_data.append(
                {
                    "atom_index": atom.GetIdx(),
                    "atom_symbol": atom.GetSymbol(),
                    "hybridization": _get_hybridization(atom),
                }
            )

        # ---- Polarity -------------------------------------------------------
        polarity_data = _compute_polarity(mol, conf)

        # ---- Symmetry -------------------------------------------------------
        symmetry_data = _detect_symmetry(mol)

        # ---- Structural descriptors -----------------------------------------
        num_rotatable = int(Descriptors.NumRotatableBonds(mol))
        ring_info = mol.GetRingInfo()
        ring_count = ring_info.NumRings()
        is_aromatic = any(atom.GetIsAromatic() for atom in mol.GetAtoms())

        return {
            "bond_lengths": bond_lengths,
            "bond_angles": bond_angles,
            "dihedral_angles": dihedral_angles,
            "geometry": overall_geometry,
            "vsepr": vsepr_data,
            "hybridization": hybridization_data,
            "polarity": polarity_data,
            "symmetry": symmetry_data,
            "energy": round(energy, 4),
            "num_atoms": mol.GetNumAtoms(),
            "num_bonds": mol.GetNumBonds(),
            "num_rotatable_bonds": num_rotatable,
            "ring_count": ring_count,
            "aromatic": is_aromatic,
        }

    def optimize_from_formula(self, formula: str) -> dict:
        """Optimize geometry from a chemical formula.

        Falls back to StructureGenerator._guess_smiles when the formula
        is not in the lookup table.

        Args:
            formula: A chemical formula (e.g. "H2O").

        Returns:
            Geometry optimization results.

        Raises:
            ValueError: If the formula cannot be resolved to a SMILES string.
        """
        smiles = FORMULA_TO_SMILES.get(formula)
        if smiles is None:
            from app.engine.structure_generator import StructureGenerator

            gen = StructureGenerator()
            smiles = gen._guess_smiles(formula)
        if smiles is None:
            raise ValueError(f"Unknown formula: {formula}")
        return self.optimize(smiles)
