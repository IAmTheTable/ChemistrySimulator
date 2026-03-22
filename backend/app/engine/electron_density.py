"""Electron density calculator using RDKit Gasteiger charges.

Generates atom positions with partial charges for electrostatic
potential visualization.
"""

from __future__ import annotations

from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors

from app.engine.structure_generator import FORMULA_TO_SMILES


class ElectronDensityCalculator:
    """Calculate partial charges and electron density data for molecules."""

    def calculate(self, formula: str) -> dict:
        """Generate atom positions with Gasteiger partial charges.

        Args:
            formula: A chemical formula (e.g. "H2O").

        Returns:
            Dictionary with atoms list containing positions and charges,
            plus molecular properties.

        Raises:
            ValueError: If the formula is not recognized.
        """
        smiles = FORMULA_TO_SMILES.get(formula)
        if smiles is None:
            raise ValueError(f"Unknown formula: {formula}")

        return self.calculate_from_smiles(smiles, formula)

    def calculate_from_smiles(self, smiles: str, formula: str | None = None) -> dict:
        """Generate atom positions with Gasteiger partial charges from SMILES.

        Args:
            smiles: A SMILES string for the molecule.
            formula: Optional formula label.

        Returns:
            Dictionary with atoms list containing positions and charges.
        """
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES: {smiles}")

        mol = Chem.AddHs(mol)

        # Generate 3D coordinates
        AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())
        try:
            AllChem.MMFFOptimizeMolecule(mol)
        except Exception:
            pass

        # Compute Gasteiger charges
        AllChem.ComputeGasteigerCharges(mol)

        conf = mol.GetConformer()
        atoms = []
        total_charge = 0.0

        for i in range(mol.GetNumAtoms()):
            atom = mol.GetAtomWithIdx(i)
            pos = conf.GetAtomPosition(i)
            charge = float(atom.GetDoubleProp("_GasteigerCharge"))

            # Handle NaN charges (can happen for some atoms)
            if charge != charge:  # NaN check
                charge = 0.0

            total_charge += charge
            atoms.append({
                "index": i,
                "symbol": atom.GetSymbol(),
                "x": round(float(pos.x), 4),
                "y": round(float(pos.y), 4),
                "z": round(float(pos.z), 4),
                "partial_charge": round(charge, 4),
            })

        return {
            "formula": formula or Chem.rdMolDescriptors.CalcMolFormula(mol),
            "atoms": atoms,
            "total_charge": round(total_charge, 4),
            "num_atoms": len(atoms),
        }

    def get_molecular_energy(self, formula: str) -> dict:
        """Get molecular energy using MMFF force field.

        Args:
            formula: A chemical formula (e.g. "H2O").

        Returns:
            Dictionary with energy value and unit.

        Raises:
            ValueError: If the formula is not recognized.
        """
        smiles = FORMULA_TO_SMILES.get(formula)
        if smiles is None:
            raise ValueError(f"Unknown formula: {formula}")

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES derived from formula: {formula}")

        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())

        energy = 0.0
        try:
            AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
            props = AllChem.MMFFGetMoleculeProperties(mol)
            ff = AllChem.MMFFGetMoleculeForceField(mol, props)
            if ff is not None:
                energy = ff.CalcEnergy()
        except Exception:
            pass

        return {
            "formula": formula,
            "energy": round(energy, 4),
            "unit": "kcal/mol",
            "method": "MMFF94",
        }
