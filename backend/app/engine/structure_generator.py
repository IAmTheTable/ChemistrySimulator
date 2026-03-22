"""3D molecular structure generator using RDKit.

Converts SMILES strings or chemical formulas into MoleculeData objects
with 3D coordinates, CPK colors, covalent radii, and bond information.
"""

from __future__ import annotations

from rdkit import Chem
from rdkit.Chem import rdMolDescriptors

from app.engine.nomenclature import name_compound
from app.engine.rdkit_utils import prepare_molecule
from app.models.structure import AtomData, BondData, MoleculeData

# ---------------------------------------------------------------------------
# Data tables
# ---------------------------------------------------------------------------

CPK_COLORS: dict[str, str] = {
    "H": "#FFFFFF", "C": "#909090", "N": "#3050F8", "O": "#FF0000",
    "F": "#90E050", "Cl": "#1FF01F", "Br": "#A62929", "I": "#940094",
    "S": "#FFFF30", "P": "#FF8000", "Na": "#AB5CF2", "K": "#8F40D4",
    "Ca": "#3DFF00", "Mg": "#8AFF00", "Fe": "#E06633", "Cu": "#C88033",
    "Zn": "#7D80B0", "Ag": "#C0C0C0", "Au": "#FFD123",
}

COVALENT_RADII: dict[str, float] = {
    "H": 0.31, "C": 0.77, "N": 0.75, "O": 0.73, "F": 0.72,
    "Cl": 0.99, "Br": 1.14, "I": 1.33, "S": 1.02, "P": 1.06,
    "Na": 1.66, "K": 2.03, "Ca": 1.76, "Mg": 1.41, "Fe": 1.25,
    "Cu": 1.32, "Zn": 1.22, "Ag": 1.45, "Au": 1.36,
}

FORMULA_TO_SMILES: dict[str, str] = {
    "H2O": "O", "CO2": "O=C=O", "NH3": "N", "CH4": "C",
    "C2H5OH": "CCO", "CH3OH": "CO", "H2O2": "OO",
    "HCl": "Cl", "HF": "F", "HBr": "Br",
    "H2SO4": "OS(=O)(=O)O", "HNO3": "O[N+](=O)[O-]",
    "CH3COOH": "CC(=O)O", "C6H6": "c1ccccc1",
    "C2H4": "C=C", "C2H2": "C#C", "CH2O": "C=O",
}

# RDKit bond type to integer order mapping
_BOND_ORDER_MAP: dict[Chem.rdchem.BondType, int] = {
    Chem.rdchem.BondType.SINGLE: 1,
    Chem.rdchem.BondType.DOUBLE: 2,
    Chem.rdchem.BondType.TRIPLE: 3,
    Chem.rdchem.BondType.AROMATIC: 2,
}

DEFAULT_COLOR = "#FF1493"  # deep pink for unknown elements
DEFAULT_RADIUS = 1.0


# ---------------------------------------------------------------------------
# StructureGenerator
# ---------------------------------------------------------------------------

class StructureGenerator:
    """Generate 3D molecular structure data from SMILES or formula input."""

    def generate(
        self, input_str: str, input_type: str = "smiles"
    ) -> MoleculeData | None:
        """Generate a MoleculeData object from a SMILES string or formula.

        Args:
            input_str: A SMILES string or chemical formula.
            input_type: Either "smiles" or "formula".

        Returns:
            A MoleculeData object with 3D coordinates, or None if parsing fails.
        """
        if input_type == "formula":
            smiles = FORMULA_TO_SMILES.get(input_str)
            if smiles is None:
                return None
        else:
            smiles = input_str

        return self._from_smiles(smiles)

    def _from_smiles(self, smiles: str) -> MoleculeData | None:
        """Convert a SMILES string to a MoleculeData object."""
        try:
            mol = prepare_molecule(smiles)
        except ValueError:
            return None

        conf = mol.GetConformer()

        # Extract atom data
        atoms: list[AtomData] = []
        for i in range(mol.GetNumAtoms()):
            atom = mol.GetAtomWithIdx(i)
            symbol = atom.GetSymbol()
            pos = conf.GetAtomPosition(i)
            atoms.append(
                AtomData(
                    index=i,
                    symbol=symbol,
                    x=float(pos.x),
                    y=float(pos.y),
                    z=float(pos.z),
                    color=CPK_COLORS.get(symbol, DEFAULT_COLOR),
                    radius=COVALENT_RADII.get(symbol, DEFAULT_RADIUS),
                )
            )

        # Extract bond data
        bonds: list[BondData] = []
        for bond in mol.GetBonds():
            order = _BOND_ORDER_MAP.get(bond.GetBondType(), 1)
            bonds.append(
                BondData(
                    atom1=bond.GetBeginAtomIdx(),
                    atom2=bond.GetEndAtomIdx(),
                    order=order,
                )
            )

        # Get molecular formula and name
        formula = rdMolDescriptors.CalcMolFormula(mol)
        name = name_compound(formula)

        return MoleculeData(
            formula=formula,
            name=name,
            atoms=atoms,
            bonds=bonds,
        )
