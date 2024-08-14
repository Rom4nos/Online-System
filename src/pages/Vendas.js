import React, { useState, useEffect } from 'react';
import { db } from '../Firebase';
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import Autosuggest from 'react-autosuggest';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
import './Vendas.css';

const Vendas = () => {
  const [produtos, setProdutos] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [value, setValue] = useState('');
  const [totalPriceWithoutDiscount, setTotalPriceWithoutDiscount] = useState(0);
  const [indicacao, setIndicacao] = useState('');
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cliente, setCliente] = useState({
    nome: '',
    cpf: '',
    endereco: '',
    cep: '',
    estado: '',
    cidade: ''
  });
  const [saleCompleted, setSaleCompleted] = useState(false);
  const { currentUser } = useAuth();

  const fetchCategoryDiscount = async (categoryId) => {
    try {
      const categoryDoc = doc(db, 'categorias', categoryId);
      const categorySnapshot = await getDoc(categoryDoc);
      
      if (categorySnapshot.exists()) {
        const categoryData = categorySnapshot.data();
        console.log('Category discount data:', categoryData);
        return categoryData.desconto || 0;
      } else {
        console.log('No such category document!');
        return 0;
      }
    } catch (error) {
      console.error('Error fetching category discount:', error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'produtos'));
        const produtosArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProdutos(produtosArray);
      } catch (error) {
        console.error("Error fetching produtos data: ", error);
      }
    };

    const fetchSponsors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'patrocinados'));
        const sponsorsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSponsors(sponsorsArray);
      } catch (error) {
        console.error("Error fetching patrocinados data: ", error);
      }
    };

    fetchProdutos();
    fetchSponsors();
  }, []);

  const getSuggestions = (value) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : produtos.filter(
      (produto) => produto.nome.toLowerCase().includes(inputValue) ||
        produto.codigo.toLowerCase().includes(inputValue)
    );
  };

  const getSuggestionValue = (suggestion) => `${suggestion.nome} - ${suggestion.cor} - ${suggestion.tamanho}`;

  const renderSuggestion = (suggestion) => (
    <div>{`${suggestion.nome} - ${suggestion.cor} SZ: ${suggestion.tamanho}`}</div>
  );

  const handleSuggestionSelected = (event, { suggestion }) => {
    const existingProduct = selectedProducts.find(product => product.id === suggestion.id);
    if (existingProduct) {
      setSelectedProducts(selectedProducts.map(product =>
        product.id === suggestion.id
          ? { ...product, quantity: product.quantity + 1 }
          : product
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...suggestion, quantity: 1 }]);
    }
    setValue('');
  };

  const inputProps = {
    placeholder: 'Nome ou Número do Produto',
    value,
    onChange: (e, { newValue }) => setValue(newValue)
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((product) => product.id !== productId));
  };

  const changeQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(product =>
      product.id === productId
        ? { ...product, quantity }
        : product
    ));
  };

  const calculateTotalPrice = async () => {
    let total = 0;
    
    for (const product of selectedProducts) {
      const categoryDiscount = await fetchCategoryDiscount(product.categoria);
      console.log(`Product ${product.nome} category discount: ${categoryDiscount}`); // Log para verificar o desconto da categoria
      
      const productTotal = product.preco * product.quantity;
      let discountAmount = 0;
      
      // Aplica o desconto somente se a forma de pagamento for Dinheiro ou PIX
      if (paymentMethod === 'PIX' || paymentMethod === 'Dinheiro') {
        discountAmount = categoryDiscount * product.quantity;
      }
      
      // Subtrai o desconto fixo do total do produto
      total += productTotal - discountAmount;
    }
    
    setTotalPriceWithoutDiscount(total);
    setTotalPrice(total - (total * (discount / 100))); // Aplica o desconto percentual se houver
  };
  

  useEffect(() => {
    calculateTotalPrice();
  }, [selectedProducts, discount, paymentMethod]);

  const handleVender = async () => {
    if (!currentUser) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      const vendasRef = collection(db, 'vendas');
      const produtosRef = collection(db, 'produtos');

      const saleData = {
        totalValue: totalPrice,
        discount: discount,
        indicacao: indicacao,
        paymentMethod: paymentMethod,
        soldProducts: selectedProducts.map(product => ({
          id: product.codigo,
          nome: product.nome,
          cor: product.cor,
          tamanho: product.tamanho,
          quantity: product.quantity,
          categoria: product.categoria || 0,
          preco: product.preco,
          custo: product.precoCusto
        })),
        seller: currentUser.email,
        saleTime: Timestamp.now(),
        cliente: { ...cliente }
      };

      await addDoc(vendasRef, saleData);

      for (const product of selectedProducts) {
        const productRef = doc(produtosRef, product.id);
        await updateDoc(productRef, {
          quantidade: product.quantidade - product.quantity,
        });
      }

      setSelectedProducts([]);
      setDiscount(0);
      setIndicacao('');
      setPaymentMethod('');
      setCliente({
        nome: '',
        cpf: '',
        endereco: '',
        cep: '',
        estado: '',
        cidade: ''
      });
      setSaleCompleted(true);
      setTimeout(() => setSaleCompleted(false), 3000);
      console.log('Venda registrada com sucesso');
    } catch (error) {
      console.error('Erro ao registrar a venda:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="vendas-container">
        <h1>Vender</h1>
        <div className="search-bar">
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={({ value }) => setSuggestions(getSuggestions(value))}
            onSuggestionsClearRequested={() => setSuggestions([])}
            onSuggestionSelected={handleSuggestionSelected}
            getSuggestionValue={getSuggestionValue}
            renderSuggestion={renderSuggestion}
            inputProps={inputProps}
          />
        </div>
        <ul>
          {selectedProducts.map((product) => (
            <li key={product.id} className="card">
              <img src={product.imagem} alt={product.nome} />
              <div className="card-details">
                <button className="remove-button" onClick={() => removeProduct(product.id)}>
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
                <p>Nome: {product.nome} {product.cor}</p>
                <p>Tamanho: {product.tamanho}</p>
                <p>Quantidade:
                  <input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => changeQuantity(product.id, Number(e.target.value))}
                  />
                </p>
                <p>Preço Total: R$ {(product.preco * product.quantity).toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div>
          <p>Desconto:
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            /> %
          </p>
          <p>Indicação:
            <select value={indicacao} onChange={(e) => setIndicacao(e.target.value)}>
              <option value="">Selecione um Patrocinado</option>
              {sponsors.map(sponsor => (
                <option key={sponsor.id} value={sponsor.name}>{sponsor.name}</option>
              ))}
            </select>
          </p>
          <p>Forma de Pagamento:
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">Selecione</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartao de Credito">Cartão de Crédito</option>
              <option value="PIX">PIX</option>
            </select>
          </p>
          <h2>Preço Total Sem Desconto: R$ {totalPriceWithoutDiscount.toFixed(2)}</h2>
          <h2>Preço Total com Desconto: R$ {totalPrice.toFixed(2)}</h2>
        </div>
        <div className="client-info">
          <h3>Informações do Cliente</h3>
          <input
            type="text"
            placeholder="Nome"
            value={cliente.nome}
            onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
          />
          <input
            type="text"
            placeholder="CPF"
            value={cliente.cpf}
            onChange={(e) => setCliente({ ...cliente, cpf: e.target.value })}
          />
          <input
            type="text"
            placeholder="Endereço"
            value={cliente.endereco}
            onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })}
          />
          <input
            type="text"
            placeholder="CEP"
            value={cliente.cep}
            onChange={(e) => setCliente({ ...cliente, cep: e.target.value })}
          />
          <input
            type="text"
            placeholder="Estado"
            value={cliente.estado}
            onChange={(e) => setCliente({ ...cliente, estado: e.target.value })}
          />
          <input
            type="text"
            placeholder="Cidade"
            value={cliente.cidade}
            onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })}
          />
        </div>
        <button onClick={handleVender} disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Venda'}
        </button>
        {saleCompleted && <div className="sale-success"><FontAwesomeIcon icon={faCheck} /> Venda concluída com sucesso!</div>}
      </div>
    </div>
  );
};

export default Vendas;
