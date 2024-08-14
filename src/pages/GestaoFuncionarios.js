import React, { useState, useEffect } from 'react';
import { auth, db } from '../Firebase';
import Header from '../components/Header';
import './GestaoFuncionarios.css';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

const GestaoFuncionarios = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', position: 'user', email: '', password: '' });
  const [editEmployee, setEditEmployee] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [newSponsor, setNewSponsor] = useState({ name: '', email: '' });
  const [editSponsor, setEditSponsor] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      setEmployees(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    const fetchSponsors = async () => {
      const querySnapshot = await getDocs(collection(db, 'patrocinados'));
      setSponsors(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchEmployees();
    fetchSponsors();
  }, []);

  const handleAddEmployee = async () => {
    const adminEmail = auth.currentUser.email;
    const adminPassword = prompt('Insira sua senha para continuar:');

    try {
      const { email, password, ...userData } = newEmployee;

      // Validate inputs before proceeding
      if (!email || !password || !userData.name || (userData.position !== 'user' && userData.position !== 'admin')) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // Step 2: Add user details to Firestore with UID as the document ID
      await setDoc(doc(db, 'users', uid), { ...userData, email, uid });

      // Reset form state
      setNewEmployee({ name: '', position: 'user', email: '', password: '' });

      // Optionally, update employees state to trigger re-render
      const querySnapshot = await getDocs(collection(db, 'users'));
      setEmployees(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      // Step 3: Reauthenticate admin user
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      alert('Adicionado Corretamente!');
    } catch (error) {
      console.error('Error adding employee:', error.message);
      alert(`Erro ao adicionar: ${error.message}`);
    }
  };

  const handleUpdateEmployee = async (id) => {
    try {
      await updateDoc(doc(db, 'users', id), editEmployee);
      setEditEmployee(null);
      alert('Atualizacao Concluida!');
    } catch (error) {
      console.error('Error updating employee:', error.message);
      alert(`erro atualizando funcionario: ${error.message}`);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      // Step 1: Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', id));
      const userEmail = userDoc.data().email;

      // Step 2: Delete user data from Firestore
      await deleteDoc(doc(db, 'users', id));

      // Optionally, update employees state after deletion
      const updatedEmployees = employees.filter(employee => employee.id !== id);
      setEmployees(updatedEmployees);

      // Step 3: Alert to delete user from Authentication
      alert(`Para deletar completamente, por favor delete manualmente ${userEmail} da Autenticacao.`);

    } catch (error) {
      console.error('Error deletando:', error.message);
      alert(`Erro ao deletar: ${error.message}`);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Email Enviado!.');
    } catch (error) {
      console.error('Erro Enviando Email:', error.message);
      alert(`Erro enviando Email: ${error.message}`);
    }
  };

  const handleAddSponsor = async () => {
    try {
      const { name, email } = newSponsor;

      // Validate inputs before proceeding
      if (!name || !email) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      // Add new sponsor to Firestore
      await addDoc(collection(db, 'patrocinados'), { name, email });

      // Reset form state
      setNewSponsor({ name: '', email: '' });

      // Optionally, update sponsors state to trigger re-render
      const querySnapshot = await getDocs(collection(db, 'patrocinados'));
      setSponsors(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      alert('Patrocinado adicionado corretamente!');
    } catch (error) {
      console.error('Erro ao adicionar patrocinado:', error.message);
      alert(`Erro ao adicionar patrocinado: ${error.message}`);
    }
  };

  const handleUpdateSponsor = async (id) => {
    try {
      await updateDoc(doc(db, 'patrocinados', id), editSponsor);
      setEditSponsor(null);
      alert('Atualização concluída!');
    } catch (error) {
      console.error('Erro ao atualizar patrocinado:', error.message);
      alert(`Erro ao atualizar patrocinado: ${error.message}`);
    }
  };

  const handleDeleteSponsor = async (id) => {
    try {
      await deleteDoc(doc(db, 'patrocinados', id));

      // Optionally, update sponsors state after deletion
      const updatedSponsors = sponsors.filter(sponsor => sponsor.id !== id);
      setSponsors(updatedSponsors);

      alert('Patrocinado deletado corretamente!');
    } catch (error) {
      console.error('Erro ao deletar patrocinado:', error.message);
      alert(`Erro ao deletar patrocinado: ${error.message}`);
    }
  };

  return (
    <div className="home-page">
      <Header />
      <div className="gestao-funcionarios">
        <h2>Gestão de Funcionários</h2>
        <div className="add-employee">
          <input
            type="text"
            placeholder="Nome"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          />
          <select
            value={newEmployee.position}
            onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="email"
            placeholder="Email"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Senha"
            value={newEmployee.password}
            onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
          />
          <button onClick={handleAddEmployee}>Adicionar Funcionario</button>
        </div>
        <div className="employee-list">
          {employees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <p>Nome: {employee.name}</p>
              <p>Posicao: {employee.position}</p>
              <p>{employee.email}</p>
              <button onClick={() => handleResetPassword(employee.email)}>Resetar Senha</button>
              {editEmployee?.id === employee.id ? (
                <>
                  <input
                    type="text"
                    value={editEmployee.name}
                    onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                  />
                  <select
                    value={editEmployee.position}
                    onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => handleUpdateEmployee(employee.id)}>Salvar</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditEmployee(employee)}>Editar</button>
                  <button onClick={() => handleDeleteEmployee(employee.id)}>Deletar</button>
                </>
              )}
            </div>
          ))}
        </div>

        <h2>Gestão de Patrocinados</h2>
        <div className="add-sponsor">
          <input
            type="text"
            placeholder="Nome"
            value={newSponsor.name}
            onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={newSponsor.email}
            onChange={(e) => setNewSponsor({ ...newSponsor, email: e.target.value })}
          />
          <button onClick={handleAddSponsor}>Adicionar Patrocinado</button>
        </div>
        <div className="sponsor-list">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="sponsor-card">
              <p>Nome: {sponsor.name}</p>
              <p>Email: {sponsor.email}</p>
              {editSponsor?.id === sponsor.id ? (
                <>
                  <input
                    type="text"
                    value={editSponsor.name}
                    onChange={(e) => setEditSponsor({ ...editSponsor, name: e.target.value })}
                  />
                  <input
                    type="email"
                    value={editSponsor.email}
                    onChange={(e) => setEditSponsor({ ...editSponsor, email: e.target.value })}
                  />
                  <button onClick={() => handleUpdateSponsor(sponsor.id)}>Salvar</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditSponsor(sponsor)}>Editar</button>
                  <button onClick={() => handleDeleteSponsor(sponsor.id)}>Deletar</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GestaoFuncionarios;
