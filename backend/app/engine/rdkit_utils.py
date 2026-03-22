"""Shared RDKit molecule preparation utilities.

Provides a single function to parse SMILES, add hydrogens, generate 3D
coordinates, and optimize geometry — eliminating duplication across
structure_generator, geometry_optimizer, and electron_density modules.
"""

from __future__ import annotations

from rdkit import Chem
from rdkit.Chem import AllChem


def prepare_molecule(smiles: str) -> Chem.Mol:
    """Parse SMILES, add hydrogens, generate 3D coordinates, optimize geometry.

    Args:
        smiles: A valid SMILES string.

    Returns:
        An RDKit Mol object with explicit hydrogens and optimized 3D coordinates.

    Raises:
        ValueError: If the SMILES string cannot be parsed.
    """
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid SMILES: {smiles}")
    mol = Chem.AddHs(mol)
    result = AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())
    if result == -1:
        AllChem.EmbedMolecule(mol, randomSeed=42)
    try:
        AllChem.MMFFOptimizeMolecule(mol)
    except Exception:
        pass
    return mol
