import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../Firebase';
import Header from '../components/Header'; // Certifique-se de ajustar o caminho conforme necessário
import './PedidosPage.css';

const PedidosPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [valorPedido, setValorPedido] = useState(0);
  const [impostoPago, setImpostoPago] = useState(0);
  const [ultimoPedido, setUltimoPedido] = useState([]);
  const [codigoProduto, setCodigoProduto] = useState(''); // Alterado para código do produto
  const [quantidadeProduto, setQuantidadeProduto] = useState('');

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'produtos'));
        const produtosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProdutos(produtosList);
      } catch (error) {
        console.error('Error fetching produtos:', error.message);
      }
    };

    const fetchUltimosPedidos = async () => {
      try {
        const pedidosCollection = collection(db, 'pedidos');
        const q = query(pedidosCollection, orderBy('data', 'desc'));
        const querySnapshot = await getDocs(q);
        const pedidos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUltimoPedido(pedidos);
      } catch (error) {
        console.error('Error fetching pedidos:', error.message);
      }
    };

    fetchProdutos();
    fetchUltimosPedidos();
  }, []);

  const handleAdicionarProduto = () => {
    const produto = produtos.find(p => p.codigo === codigoProduto); // Usar código do produto
    if (produto) {
      const valorProduto = produto.preco * quantidadeProduto;
      setProdutosSelecionados([...produtosSelecionados, { produto, quantidade: quantidadeProduto, valor: valorProduto }]);
      setValorPedido(valorPedido + valorProduto);
      setCodigoProduto('');
      setQuantidadeProduto('');
    }
  };

  const handleGerarPedido = async () => {
    try {
      const pedido = {
        produtos: produtosSelecionados.map(item => ({
          produto: {
            id: item.produto.id,
            nome: item.produto.nome,
            preco: item.produto.preco
          },
          quantidade: item.quantidade,
          valor: item.valor
        })),
        valorTotal: valorPedido,
        impostoPago,
        data: new Date() // Timestamp automatically managed by Firestore
      };
      await addDoc(collection(db, 'pedidos'), pedido);
      setProdutosSelecionados([]);
      setValorPedido(0);
      setImpostoPago(0);
      // Atualiza a lista de pedidos após a adição
      await fetchUltimosPedidos(); // Certifique-se de aguardar a atualização
    } catch (error) {
      console.error('Error creating pedido:', error.message);
    }
  };

  const fetchUltimosPedidos = async () => {
    try {
      const pedidosCollection = collection(db, 'pedidos');
      const q = query(pedidosCollection, orderBy('data', 'desc'));
      const querySnapshot = await getDocs(q);
      const pedidos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUltimoPedido(pedidos);
    } catch (error) {
      console.error('Error fetching pedidos:', error.message);
    }
  };

  return (
    <div className="pedidos-page">
      <Header /> {/* Importando e adicionando o cabeçalho */}
      <h1>Pedidos</h1>
      <div className="pedido-form">
        <h2>Gerar Novo Pedido</h2>
        <div>
          <label>Código do Produto:</label>
          <select value={codigoProduto} onChange={(e) => setCodigoProduto(e.target.value)}>
            <option value="">Selecione um produto</option>
            {produtos.map(produto => (
              <option key={produto.codigo} value={produto.codigo}>{produto.nome} - {produto.codigo}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Quantidade:</label>
          <input
            type="number"
            value={quantidadeProduto}
            onChange={(e) => setQuantidadeProduto(Number(e.target.value))}
            min="1"
          />
        </div>
        <button onClick={handleAdicionarProduto}>Adicionar Produto</button>
        <h3>Resumo do Pedido</h3>
        <ul>
          {produtosSelecionados.map((item, index) => (
            <li key={index}>
              {item.produto.nome} - {item.quantidade} unidades - R$ {item.valor.toFixed(2)}
            </li>
          ))}
        </ul>
        <div>
          <p>Valor Total: R$ {valorPedido.toFixed(2)}</p>
          <label>Imposto Pago:</label>
          <input
            type="number"
            value={impostoPago}
            onChange={(e) => setImpostoPago(Number(e.target.value))}
            min="0"
          />
        </div>
        <button onClick={handleGerarPedido}>Gerar Pedido</button>
      </div>
      <div className="ultimos-pedidos">
        <h2>Últimos Pedidos</h2>
        <ul>
          {ultimoPedido.map(pedido => (
            <li key={pedido.id}>
              <p><strong>ID:</strong> {pedido.id}</p>
              <p><strong>Data:</strong> {new Date(pedido.data.seconds * 1000).toLocaleString()}</p>
              <p><strong>Valor Total:</strong> R$ {pedido.valorTotal.toFixed(2)}</p>
              <p><strong>Imposto Pago:</strong> R$ {pedido.impostoPago.toFixed(2)}</p>
              <ul>
                {pedido.produtos.map((item, index) => (
                  <li key={index}>
                    {item.produto.nome} - {item.quantidade} unidades - R$ {item.valor.toFixed(2)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PedidosPage;
