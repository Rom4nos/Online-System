import React, { useState, useEffect } from 'react';
import { db, storage, } from '../Firebase';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import './Produtos.css';
import { collection, addDoc, getDocs, updateDoc, doc, where, query, deleteDoc, getDoc} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faRuler, faBoxes, faPalette, faMoneyBill, faMoneyBillAlt, faCamera, faSearch, faTimes, faTrash, faEdit} from '@fortawesome/free-solid-svg-icons';
import Autosuggest from 'react-autosuggest';

const InputField = ({ icon, placeholder, value, onChange, type = "text", maxLength = 10 }) => (
  <div className="input-container">
    <FontAwesomeIcon icon={icon} className="input-icon" />
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
    />
  </div>
);

const ProductList = () => {
  const [produtos, setProdutos] = useState([]);
  const [novoProduto, setNovoProduto] = useState({ 
    codigo: '', 
    imagem: '', 
    nome: '', 
    tamanho: '', 
    quantidade: '', 
    cor: '', 
    preco: '', 
    precoCusto: '',
    categoria: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editProdutoId, setEditProdutoId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { currentUser } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    desconto: '',
  });
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      const querySnapshot = await getDocs(collection(db, 'produtos'));
      setProdutos(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchCategorias();
    fetchProdutos();
  }, []);

  const handleAddProduto = async () => {
    try {
      setIsLoading(true);
      const codigoProduto = await generateUniqueCode();
      const imageUrl = novoProduto.imagem ? await uploadImage(novoProduto.imagem, codigoProduto) : '';
      await addDoc(collection(db, 'produtos'), { ...novoProduto, codigo: codigoProduto, imagem: imageUrl });
      refreshProdutos();
      resetForm();
      alert('Produto adicionado com sucesso!');
    } catch (error) {
      alert(`Erro ao adicionar produto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduto = async () => {
    try {
      setIsLoading(true);
      const imageUrl = novoProduto.imagem instanceof File ? await uploadImage(novoProduto.imagem, novoProduto.codigo) : novoProduto.imagem;
      await updateDoc(doc(db, 'produtos', editProdutoId), { ...novoProduto, imagem: imageUrl });
      refreshProdutos();
      resetForm();
      alert('Produto atualizado com sucesso!');
    } catch (error) {
      alert(`Erro ao atualizar produto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }; 
  
  const getUserPosition = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.position;
    } else {
      throw new Error('User not found');
    }
  };

  const handleDeleteProduto = async (id, codigo) => {
    if (!currentUser) {
      alert('Usuário não autenticado.');
      return;
    }

    const userId = currentUser.uid;

    try {
      // Get user's position
      const userPosition = await getUserPosition(userId);
      if (userPosition !== 'admin') {
        alert('Você não tem permissão para deletar este produto.');
        return;
      }

      // Delete product document
      await deleteDoc(doc(db, 'produtos', id));

      // Delete product image from storage
      const storageRef = ref(storage, `produtos/${codigo}`);
      try {
        await deleteObject(storageRef);
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          console.warn('No image found for this produto.');
        } else {
          throw error;
        }
      }

      refreshProdutos();

      alert('Produto deletado com sucesso!');
    } catch (error) {
      alert(`Erro ao deletar produto: ${error.message}`);
    }
  };

  const generateUniqueCode = async () => {
    let uniqueCode = '';
    while (true) {
      uniqueCode = Math.random().toString(36).substr(2, 5) + Date.now().toString(36);
      const q = query(collection(db, 'produtos'), where('codigo', '==', uniqueCode));
      if ((await getDocs(q)).empty) break;
    }
    return uniqueCode;
  };

  const uploadImage = async (image, codigo) => {
    const imageRef = ref(storage, `produtos/${codigo}`);
    const snapshot = await uploadBytes(imageRef, image);
    return getDownloadURL(snapshot.ref);
  };

  const refreshProdutos = async () => {
    const querySnapshot = await getDocs(collection(db, 'produtos'));
    setProdutos(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  const resetForm = () => {
    setNovoProduto({ codigo: '', imagem: '', nome: '', tamanho: '', quantidade: '', cor: '', preco: '', precoCusto: '' });
    setEditProdutoId(null);
  };

  const fetchCategorias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categorias'));
      const categoriasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };
  
  
  const handleSearchClick = () => {
    setFilteredProducts(produtos.filter(prod =>
      prod.nome.toLowerCase().includes(searchValue.toLowerCase()) || prod.codigo.toLowerCase().includes(searchValue.toLowerCase())
    ));
  };

  const inputProps = {
    placeholder: 'Buscar por nome ou código',
    value: searchValue,
    onChange: (e, { newValue }) => setSearchValue(newValue)
  };

  const getSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    return produtos.filter(produto =>
      produto.nome.toLowerCase().includes(inputValue) || produto.codigo.toLowerCase().includes(inputValue)
    );
  };

  const handleSuggestionSelected = (event, { suggestion }) => {
    setSelectedProduct(suggestion);
    setSearchValue(`${suggestion.nome} - ${suggestion.cor} - ${suggestion.tamanho}`);
  };

  const filteredProdutos = selectedProduct
    ? [selectedProduct, ...produtos.filter(produto => produto.id !== selectedProduct.id)]
    : produtos.filter(produto => produto.nome.toLowerCase().includes(searchValue.toLowerCase()));

    const handleAddCategoria = async () => {
      if (categoriaEditando) {
        // Atualiza a categoria existente
        setCategorias(prevCategorias =>
          prevCategorias.map(categoria =>
            categoria.id === categoriaEditando
              ? { ...categoria, nome: novaCategoria.nome, desconto: novaCategoria.desconto }
              : categoria
          )
        );
    
        // Atualiza a categoria no Firestore
        const categoriaDocRef = doc(db, 'categorias', categoriaEditando);
        await updateDoc(categoriaDocRef, {
          nome: novaCategoria.nome,
          desconto: novaCategoria.desconto
        });
    
        setCategoriaEditando(null);
      } else {
        // Adiciona uma nova categoria
        const newCategoria = {
          nome: novaCategoria.nome,
          desconto: novaCategoria.desconto
        };
    
        // Adiciona a categoria no Firestore
        const categoriaDocRef = await addDoc(collection(db, 'categorias'), newCategoria);
    
        // Adiciona a nova categoria ao estado local com o ID do Firestore
        setCategorias(prevCategorias => [
          ...prevCategorias,
          { id: categoriaDocRef.id, ...newCategoria }
        ]);
      }
      setNovaCategoria({ nome: '', desconto: '' });
    };
    
    const handleEditCategoria = (id) => {
      const categoria = categorias.find(c => c.id === id);
      setNovaCategoria({ nome: categoria.nome, desconto: categoria.desconto });
      setCategoriaEditando(id);
    };
    
    const handleDeleteCategoria = async (id) => {
      // Remove a categoria do estado local
      setCategorias(prevCategorias => prevCategorias.filter(categoria => categoria.id !== id));
    
      // Deleta a categoria do Firestore
      const categoriaDocRef = doc(db, 'categorias', id);
      await deleteDoc(categoriaDocRef);
    };

    return (
      <div className="container-produtos">
        <Header />
        <div className="produtos-page">
        <div className="search-bar">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value))}
              onSuggestionsClearRequested={() => setSuggestions([])}
              onSuggestionSelected={handleSuggestionSelected}
              getSuggestionValue={suggestion => `${suggestion.nome} - ${suggestion.cor} -${suggestion.tamanho}`}
              renderSuggestion={suggestion => <div>{`${suggestion.nome} - ${suggestion.cor} SZ: ${suggestion.tamanho}`}</div>}
              inputProps={inputProps}
            />
            <div className="buttons-page">
              <button onClick={handleSearchClick}><FontAwesomeIcon icon={faSearch} /></button>
              {searchValue && <button onClick={() => setSearchValue('')}><FontAwesomeIcon icon={faTimes} /></button>}
            </div>
          </div>
          <h2>{editProdutoId ? 'Atualizar Produto' : 'Adicionar Produtos'}</h2>
          <div className="add-produto">
            <InputField icon={faTag} placeholder="Nome" value={novoProduto.nome} onChange={(value) => setNovoProduto(prev => ({ ...prev, nome: value }))} />
            <InputField icon={faRuler} placeholder="Tamanho" value={novoProduto.tamanho} onChange={(value) => setNovoProduto(prev => ({ ...prev, tamanho: value }))} />
            <InputField icon={faBoxes} placeholder="Quantidade" value={novoProduto.quantidade} onChange={(value) => setNovoProduto(prev => ({ ...prev, quantidade: value }))} type="number" />
            <InputField icon={faPalette} placeholder="Cor" value={novoProduto.cor} onChange={(value) => setNovoProduto(prev => ({ ...prev, cor: value }))} />
            <InputField icon={faMoneyBill} placeholder="Preço" value={novoProduto.preco} onChange={(value) => setNovoProduto(prev => ({ ...prev, preco: value }))} type="number" />
            <InputField icon={faMoneyBillAlt} placeholder="Preço de Custo" value={novoProduto.precoCusto} onChange={(value) => setNovoProduto(prev => ({ ...prev, precoCusto: value }))} type="number" />
            <div className="categoria-container">
            <select
              id="categoria"
              value={novoProduto.categoria}
              onChange={(e) => setNovoProduto(prev => ({ ...prev, categoria: e.target.value }))}
            >
              <option value="">Selecione uma Categoria</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
            <label className="file-upload">
              <FontAwesomeIcon icon={faCamera} className="file-upload-icon" />
              <input id="file-upload" type="file" accept="image/*" onChange={(e) => setNovoProduto(prev => ({ ...prev, imagem: e.target.files[0] }))} style={{ display: 'none' }} />
              <span onClick={() => document.getElementById('file-upload').click()}>{novoProduto.imagem ? (novoProduto.imagem.name || 'Imagem selecionada') : 'Selecionar Imagem'}</span>
            </label>
            <button onClick={editProdutoId ? handleUpdateProduto : handleAddProduto} disabled={isLoading}>
              {isLoading ? 'Processando...' : (editProdutoId ? 'Atualizar Produto' : 'Adicionar Produto')}
            </button>
          </div>
    
          <div className="categoria-container">
      <h2>Categorias</h2>
      <div className="adicionar-categoria">
        <InputField
          placeholder="Nome da Categoria"
          value={novaCategoria.nome}
          onChange={(value) => setNovaCategoria((prev) => ({ ...prev, nome: value }))}
        />
        <InputField
          placeholder="Desconto"
          value={novaCategoria.desconto}
          onChange={(value) => setNovaCategoria((prev) => ({ ...prev, desconto: value }))}
        />
        <button onClick={handleAddCategoria}>
          {categoriaEditando ? 'Atualizar Categoria' : 'Adicionar Categoria'}
        </button>
      </div>
      <div className="lista-categorias">
      {categorias.map(categoria => (
          <div key={categoria.id} className="categoria-item">
            <p>{`Categoria: ${categoria.nome}`}</p>
            <p>{`Desconto: ${categoria.desconto}`}</p>
            <div className='buttons'>
            <button onClick={() => handleEditCategoria(categoria.id)} className="edit-button">
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button onClick={() => handleDeleteCategoria(categoria.id)} className="delete-button">
              <FontAwesomeIcon icon={faTrash} />
            </button>
            </div>
          </div>
        ))}
      </div>
    </div>
          <h2>Produtos ({filteredProdutos.length})</h2>
          <div className="produtos-list">
            {filteredProdutos.map(produto => (
              <div key={produto.id} className={`produto ${editProdutoId === produto.id ? 'edit-mode' : ''}`}>
                {editProdutoId === produto.id ? (
                  <div className="itens-produtos">
                    <div className="info-produtos">
                      <InputField placeholder="Nome" value={novoProduto.nome} onChange={(value) => setNovoProduto(prev => ({ ...prev, nome: value }))} />
                      <InputField placeholder="Tamanho" value={novoProduto.tamanho} onChange={(value) => setNovoProduto(prev => ({ ...prev, tamanho: value }))} />
                      <InputField placeholder="Quantidade" value={novoProduto.quantidade} onChange={(value) => setNovoProduto(prev => ({ ...prev, quantidade: value }))} type="number" />
                      <InputField placeholder="Cor" value={novoProduto.cor} onChange={(value) => setNovoProduto(prev => ({ ...prev, cor: value }))} />
                      <div className="categoria-container">
                      <select
                          id="categoria"
                          value={novoProduto.categoria}
                          onChange={(e) => setNovoProduto(prev => ({ ...prev, categoria: e.target.value }))}
                        >
                          <option value="">Selecione uma Categoria</option>
                          {categorias.map(categoria => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </option>
                          ))}
                        </select>
                        {novoProduto.categoria === 'nova' && <button onClick={handleAddCategoria}>Adicionar Categoria</button>}
                      </div>
                      <InputField placeholder="Preço" value={novoProduto.preco} onChange={(value) => setNovoProduto(prev => ({ ...prev, preco: value }))} type="number" />
                      <InputField placeholder="Preço de Custo" value={novoProduto.precoCusto} onChange={(value) => setNovoProduto(prev => ({ ...prev, precoCusto: value }))} type="number" />
                    </div>
                    <div className="image-codigo">
                      {novoProduto.imagem && (
                        <img
                          src={novoProduto.imagem instanceof File ? URL.createObjectURL(novoProduto.imagem) : novoProduto.imagem}
                          alt={novoProduto.nome}
                          onClick={() => document.getElementById('file-upload').click()}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="itens-produtos">
                      <div className="info-produtos">
                        <p>Nome: {produto.nome}</p>
                        <p>TAM: {produto.tamanho}</p>
                        <p>QTD: {produto.quantidade}</p>
                        <p>Cor: {produto.cor}</p>
                        <p>Cat: {categorias.find(categoria => categoria.id === produto.categoria)?.nome || 'N/A'}</p>
                        <p>Preço: {produto.preco}</p>
                        <p>Custo: {produto.precoCusto}</p>
                      </div>
                      <div className="image-codigo">
                        {produto.imagem && <img src={produto.imagem} alt={produto.nome} />}
                      </div>
                    </div>
                    <div className="codigo"><p>{produto.codigo}</p></div>
                    <div className="button-group">
                      <button onClick={() => { setEditProdutoId(produto.id); setNovoProduto(produto); }}>Editar Produto</button>
                      <button className="delete-button" onClick={() => handleDeleteProduto(produto.id, produto.codigo)}>Excluir Produto</button>
                    </div>
                  </>
                )}
                {editProdutoId === produto.id && (
                  <div className="button-group">
                    <button onClick={handleUpdateProduto}>Atualizar Produto</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
};

export default ProductList;
