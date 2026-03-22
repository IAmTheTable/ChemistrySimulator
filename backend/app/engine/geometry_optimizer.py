"""Molecular geometry optimizer using RDKit.

Optimizes molecular geometry and returns bond lengths, angles,
and geometry classification.
"""

from __future__ import annotations

import math

from rdkit import Chem
from rdkit.Chem import AllChem, rdMolTransforms

from app.engine.structure_generator import FORMULA_TO_SMILES


def _classify_geometry(num_atoms: int, num_bonds: int, bond_angles: list[float]) -> str:
    """Classify molecular geometry based on atom count and bond angles."""
    if num_atoms <= 1:
        return "atomic"
    if num_atoms == 2:
        return "linear"

    if not bond_angles:
        return "unknown"

    avg_angle = sum(bond_angles) / len(bond_angles)

    # Classify based on average bond angle around central atom
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

    # Fallback based on angle ranges
    if avg_angle < 100:
        return "bent"
    if avg_angle < 115:
        return "tetrahedral"
    if avg_angle < 125:
        return "trigonal planar"
    return "linear"


class GeometryOptimizer:
    """Optimize geometry and extract geometric properties."""

    def optimize(self, smiles: str) -> dict:
        """Optimize geometry and return bond lengths, angles, and geometry type.

        Args:
            smiles: A SMILES string for the molecule.

        Returns:
            Dictionary with bond_lengths, bond_angles, dihedral_angles,
            geometry, and energy.
        """
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES: {smiles}")

        mol = Chem.AddHs(mol)

        # Generate 3D coordinates
        result = AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())
        if result != 0:
            # Try without random seed constraint
            AllChem.EmbedMolecule(mol, randomSeed=42)

        # Optimize with MMFF force field
        energy = 0.0
        try:
            ff_result = AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
            # Get the force field for energy
            ff = AllChem.MMFFGetMoleculeForceField(mol, AllChem.MMFFGetMoleculeProperties(mol))
            if ff is not None:
                energy = ff.CalcEnergy()
        except Exception:
            pass

        conf = mol.GetConformer()

        # Extract bond lengths
        bond_lengths = []
        for bond in mol.GetBonds():
            i = bond.GetBeginAtomIdx()
            j = bond.GetEndAtomIdx()
            length = rdMolTransforms.GetBondLength(conf, i, j)
            sym_i = mol.GetAtomWithIdx(i).GetSymbol()
            sym_j = mol.GetAtomWithIdx(j).GetSymbol()
            bond_lengths.append({
                "atom1_index": i,
                "atom2_index": j,
                "atom1_symbol": sym_i,
                "atom2_symbol": sym_j,
                "length_angstrom": round(length, 4),
            })

        # Extract bond angles (for each atom with at least 2 neighbors)
        bond_angles = []
        heavy_angles = []
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
                        bond_angles.append({
                            "atom1_index": neighbors[ni],
                            "center_index": atom.GetIdx(),
                            "atom2_index": neighbors[nj],
                            "atoms": f"{sym_a}-{sym_b}-{sym_c}",
                            "angle_degrees": round(angle, 2),
                        })
                        # Track angles around heavy atoms for geometry classification
                        if atom.GetSymbol() != "H":
                            heavy_angles.append(angle)
                    except Exception:
                        pass

        # Extract dihedral angles for rotatable bonds
        dihedral_angles = []
        for bond in mol.GetBonds():
            if bond.IsInRing():
                continue
            i = bond.GetBeginAtomIdx()
            j = bond.GetEndAtomIdx()
            neighbors_i = [n.GetIdx() for n in mol.GetAtomWithIdx(i).GetNeighbors() if n.GetIdx() != j]
            neighbors_j = [n.GetIdx() for n in mol.GetAtomWithIdx(j).GetNeighbors() if n.GetIdx() != i]
            if neighbors_i and neighbors_j:
                try:
                    dihedral = rdMolTransforms.GetDihedralDeg(
                        conf, neighbors_i[0], i, j, neighbors_j[0]
                    )
                    dihedral_angles.append({
                        "atom_indices": [neighbors_i[0], i, j, neighbors_j[0]],
                        "dihedral_degrees": round(dihedral, 2),
                    })
                except Exception:
                    pass

        # Classify geometry
        # Use all angles around the central (most-connected) heavy atom
        num_total_atoms = mol.GetNumAtoms()
        all_angle_values = [a["angle_degrees"] for a in bond_angles]

        # For small molecules (1 heavy atom like CH4, NH3, H2O), use all angles
        num_heavy = sum(1 for a in mol.GetAtoms() if a.GetSymbol() != "H")
        classification_angles = heavy_angles if heavy_angles else all_angle_values
        geometry = _classify_geometry(num_total_atoms, mol.GetNumBonds(), classification_angles)

        return {
            "bond_lengths": bond_lengths,
            "bond_angles": bond_angles,
            "dihedral_angles": dihedral_angles,
            "geometry": geometry,
            "energy": round(energy, 4),
        }

    def optimize_from_formula(self, formula: str) -> dict:
        """Optimize geometry from a chemical formula.

        Args:
            formula: A chemical formula (e.g. "H2O").

        Returns:
            Geometry optimization results.

        Raises:
            ValueError: If the formula is not recognized.
        """
        smiles = FORMULA_TO_SMILES.get(formula)
        if smiles is None:
            raise ValueError(f"Unknown formula: {formula}")
        return self.optimize(smiles)
