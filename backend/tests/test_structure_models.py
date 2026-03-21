from app.models.structure import AtomData, BondData, MoleculeData, OrbitalInfo, OrbitalData


def test_atom_data():
    atom = AtomData(index=0, symbol="O", x=0.0, y=0.0, z=0.0, color="#FF0000", radius=0.73)
    assert atom.symbol == "O"
    assert atom.color == "#FF0000"


def test_bond_data():
    bond = BondData(atom1=0, atom2=1, order=2)
    assert bond.order == 2


def test_molecule_data():
    mol = MoleculeData(
        formula="H2O", name="Water",
        atoms=[
            AtomData(index=0, symbol="O", x=0.0, y=0.0, z=0.0, color="#FF0000", radius=0.73),
            AtomData(index=1, symbol="H", x=0.96, y=0.0, z=0.0, color="#FFFFFF", radius=0.31),
            AtomData(index=2, symbol="H", x=-0.24, y=0.93, z=0.0, color="#FFFFFF", radius=0.31),
        ],
        bonds=[BondData(atom1=0, atom2=1, order=1), BondData(atom1=0, atom2=2, order=1)],
        properties={"molecular_weight": 18.015, "geometry": "bent", "polar": True},
    )
    assert mol.formula == "H2O"
    assert len(mol.atoms) == 3
    assert len(mol.bonds) == 2


def test_orbital_data():
    orb = OrbitalInfo(n=2, l=1, label="2p", electrons=2, shape="dumbbell", radius=1.5,
                      orientations=["x", "y", "z"])
    assert orb.shape == "dumbbell"
    data = OrbitalData(element="Carbon", atomic_number=6,
                       electron_configuration="1s2 2s2 2p2", orbitals=[orb])
    assert len(data.orbitals) == 1
