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
    # Simple inorganics
    "H2O": "O", "H2O2": "OO", "NH3": "N", "CO2": "O=C=O", "CO": "[C-]#[O+]",
    "NO": "[N]=O", "NO2": "O=[N]=O", "N2O": "[N-]=[N+]=O", "SO2": "O=S=O", "SO3": "O=S(=O)=O",
    "HCl": "Cl", "HF": "F", "HBr": "Br", "HI": "I", "H2S": "S",
    "HCN": "C#N", "PH3": "P",
    # Acids
    "H2SO4": "OS(=O)(=O)O", "HNO3": "O[N+](=O)[O-]", "H3PO4": "OP(=O)(O)O",
    "H2CO3": "OC(=O)O", "HClO4": "OCl(=O)(=O)=O", "HClO": "OCl",
    # Alkanes
    "CH4": "C", "C2H6": "CC", "C3H8": "CCC", "C4H10": "CCCC",
    "C5H12": "CCCCC", "C6H14": "CCCCCC", "C7H16": "CCCCCCC", "C8H18": "CCCCCCCC",
    "C9H20": "CCCCCCCCC", "C10H22": "CCCCCCCCCC",
    "C11H24": "CCCCCCCCCCC", "C12H26": "CCCCCCCCCCCC",
    "C15H32": "CCCCCCCCCCCCCCC", "C20H42": "CCCCCCCCCCCCCCCCCCCC",
    # Alkenes and alkynes
    "C2H4": "C=C", "C3H6": "CC=C", "C4H8": "CCC=C", "C2H2": "C#C", "C3H4": "CC#C",
    # Alcohols
    "CH3OH": "CO", "C2H5OH": "CCO", "C3H7OH": "CCCO", "C4H9OH": "CCCCO",
    "C3H8O": "CCCO", "C2H6O": "CCO",
    "C3H8O3": "OCC(O)CO",  # Glycerol
    "C2H6O2": "OCCO",      # Ethylene glycol
    # Aldehydes and ketones
    "CH2O": "C=O", "C2H4O": "CC=O", "C3H6O": "CC(=O)C",
    # Carboxylic acids and esters
    "CH2O2": "O=CO", "C2H4O2": "CC(=O)O", "C3H6O2": "CCC(=O)O",
    "CH3COOH": "CC(=O)O", "HCOOH": "O=CO",
    # Aromatics
    "C6H6": "c1ccccc1", "C7H8": "Cc1ccccc1", "C8H10": "CCc1ccccc1",
    "C10H8": "c1ccc2ccccc2c1",  # Naphthalene
    "C6H5OH": "Oc1ccccc1",     # Phenol
    # Amines
    "CH5N": "CN", "C2H7N": "CCN", "C3H9N": "CCCN", "C4H11N": "CCCCN",
    # Amino acids
    "C2H5NO2": "NCC(=O)O",      # Glycine
    "C3H7NO2": "CC(N)C(=O)O",   # Alanine
    "C5H9NO4": "NC(CCC(=O)O)C(=O)O",  # Glutamic acid
    # Sugars
    "C6H12O6": "OC[C@@H](O1)[C@@H](O)[C@H](O)[C@@H](O)[C@@H]1O",
    "C12H22O11": "OC[C@H]1OC(O[C@@H]2OC(CO)[C@@H](O)[C@H](O)[C@H]2O)[C@H](O)[C@@H](O)[C@@H]1O",
    # Pharmacologicals
    "C8H10N4O2": "Cn1c(=O)c2c(ncn2C)n(C)c1=O",  # Caffeine
    "C10H14N2": "c1ncccc1[C@@H]1CCCCN1C",         # Nicotine
    "C9H8O4": "CC(=O)Oc1ccccc1C(=O)O",            # Aspirin
    "C13H18O2": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",     # Ibuprofen
    "C8H9NO2": "CC(=O)Nc1ccc(O)cc1",               # Acetaminophen
    "C17H19NO3": "CN1CC[C@]23c4c5ccc(O)c4O[C@H]2[C@@H](O)C=C[C@H]3[C@@H]1C5",  # Morphine
    "C9H13NO3": "CNC[C@@H](O)c1ccc(O)c(O)c1",     # Epinephrine
    "C8H11NO2": "NCCc1ccc(O)c(O)c1",               # Dopamine
    "C10H12N2O": "NCCc1c[nH]c2ccc(O)cc12",         # Serotonin
    "C12H16N2": "CN(C)CCc1c[nH]c2ccccc12",         # DMT
    "C10H15N": "CC(CC1=CC=CC=C1)NC",               # Methamphetamine
    "C21H30O2": "CCCCCC1=CC(=C2C(C1)OC(C3CC(CCC3C2C)(C)O)C)O",  # THC approx
    # Industrial solvents
    "CCl4": "ClC(Cl)(Cl)Cl", "CHCl3": "ClC(Cl)Cl", "CH2Cl2": "ClCCl",
    "CS2": "S=C=S",
    "C4H8O": "C1CCOC1",        # THF
    "C5H5N": "c1ccncc1",       # Pyridine
    # Vitamins
    "C6H8O6": "OC[C@H](O)[C@H]1OC(=O)C(O)=C1O",  # Vitamin C
    # Explosives
    "C3H5N3O9": "[O-][N+](=O)OCC(CO[N+](=O)[O-])O[N+](=O)[O-]",  # Nitroglycerin
    "C7H5N3O6": "Cc1c(cc(cc1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]",  # TNT
    "CH4N2O": "NC(=O)N",       # Urea
    # Halogenated
    "C2H3Cl": "C=CCl",         # Vinyl chloride
    "C2HCl3": "ClC=C(Cl)Cl",   # Trichloroethylene
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
                smiles = self._guess_smiles(input_str)
            if smiles is None:
                return None
        else:
            smiles = input_str

        return self._from_smiles(smiles)

    def _guess_smiles(self, formula: str) -> str | None:
        """Try to construct a SMILES string from a molecular formula.

        For organic formulas (containing C), builds a simple linear carbon chain
        with appropriate bonds. For inorganics, tries RDKit's MolFromSmiles
        with element-only SMILES.
        """
        from app.engine.equation_balancer import parse_formula as pf

        try:
            counts = pf(formula)
        except Exception:
            return None

        c = counts.get("C", 0)
        h = counts.get("H", 0)
        o = counts.get("O", 0)
        n = counts.get("N", 0)

        if c == 0:
            # Inorganic — try simple concatenation for diatomics
            if len(counts) == 1:
                sym = next(iter(counts))
                return f"[{sym}]"
            if len(counts) == 2 and counts.get("Na") and counts.get("Cl"):
                return "[Na+].[Cl-]"
            return None

        # Build a simple linear alkane chain and let RDKit add Hs
        smiles = "C" * c

        # Add oxygen as OH groups or =O
        for _ in range(min(o, c)):
            smiles += "O"

        # Add nitrogen as NH2
        for _ in range(min(n, c)):
            smiles += "N"

        # Validate with RDKit
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            # Fallback: just a carbon chain
            smiles = "C" * c
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return None

        return smiles

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
