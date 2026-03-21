from app.engine.structure_generator import StructureGenerator
from app.models.structure import MoleculeData


def test_generate_water():
    gen = StructureGenerator()
    mol = gen.generate(input_str="O", input_type="smiles")
    assert isinstance(mol, MoleculeData)
    assert mol.formula == "H2O"
    assert len(mol.atoms) == 3
    assert len(mol.bonds) == 2


def test_generate_ethanol():
    gen = StructureGenerator()
    mol = gen.generate(input_str="CCO", input_type="smiles")
    assert isinstance(mol, MoleculeData)
    assert any(a.symbol == "O" for a in mol.atoms)


def test_generate_co2_double_bonds():
    gen = StructureGenerator()
    mol = gen.generate(input_str="O=C=O", input_type="smiles")
    assert isinstance(mol, MoleculeData)
    assert any(b.order == 2 for b in mol.bonds)


def test_atoms_have_3d_coordinates():
    gen = StructureGenerator()
    mol = gen.generate(input_str="CCO", input_type="smiles")
    for atom in mol.atoms:
        assert isinstance(atom.x, float)
        assert isinstance(atom.y, float)
        assert isinstance(atom.z, float)


def test_atoms_have_cpk_colors():
    gen = StructureGenerator()
    mol = gen.generate(input_str="O", input_type="smiles")
    o_atom = next(a for a in mol.atoms if a.symbol == "O")
    assert o_atom.color == "#FF0000"


def test_invalid_smiles_returns_none():
    gen = StructureGenerator()
    mol = gen.generate(input_str="INVALID_SMILES_XYZ", input_type="smiles")
    assert mol is None


def test_generate_from_formula():
    gen = StructureGenerator()
    mol = gen.generate(input_str="H2O", input_type="formula")
    assert mol is not None
    assert mol.formula == "H2O"
