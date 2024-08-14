import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../Firebase';
import Header from '../components/Header';
import './HomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faDollarSign, faChartLine, faList } from '@fortawesome/free-solid-svg-icons';

const HomePage = () => {
  const [totalEstoqueValue, setTotalEstoqueValue] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [vendasData, setVendasData] = useState([]);
  const [selectedCard, setSelectedCard] = useState('vendas');
  const [report, setReport] = useState({
    totalSales: 0,
    totalCost: 0,
    mostSoldProduct: null,
    maxSale: null,
    topSeller: null,
    topSponsors: []
  });

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'produtos'));
        let totalValue = 0;
        const lowStock = [];

        querySnapshot.forEach((doc) => {
          const produto = doc.data();
          const { preco, quantidade, nome, precoCusto, cor, imagem, codigo } = produto;

          if (preco && quantidade) {
            totalValue += preco * quantidade;
          }

          if (quantidade < 10) {
            lowStock.push({ nome, quantidade, precoCusto, cor, imagem, codigo });
          }
        });

        setTotalEstoqueValue(totalValue);
        setLowStockProducts(lowStock);
      } catch (error) {
        console.error('Error fetching produtos:', error.message);
      }
    };

    const fetchVendas = async () => {
      try {
        const vendasCollection = collection(db, 'vendas');
        const q = query(vendasCollection, orderBy('saleTime', 'desc'));
        const querySnapshot = await getDocs(q);
        const vendas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVendasData(vendas);
        calculateReport(vendas);
      } catch (error) {
        console.error('Error fetching vendas:', error.message);
      }
    };

    fetchProdutos();
    fetchVendas();
  }, []);

  const calculateReport = async (vendas) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
  
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Último dia do mês
  
    const filteredVendas = vendas.filter(venda => {
      const saleDate = new Date(venda.saleTime.seconds * 1000);
      return saleDate >= startOfMonth && saleDate <= endOfMonth;
    });
  
    let totalSales = 0;
    let totalCost = 0;
    let productCounts = {};
    let sellerSales = {};
    let maxSale = { value: 0, venda: null };
    let sponsorCounts = {}; // Contador de indicações
  
    // Fetch product data
    const productDocs = await getDocs(collection(db, 'produtos'));
    const productMap = {};
    productDocs.forEach(doc => {
      productMap[doc.id] = doc.data();
    });
  
    // Fetch category discounts
    const categoryDocs = await getDocs(collection(db, 'categorias'));
    const categoryMap = {};
    categoryDocs.forEach(doc => {
      categoryMap[doc.id] = doc.data().desconto;
    });
  
    filteredVendas.forEach(venda => {
      totalSales += venda.totalValue;
  
      venda.soldProducts.forEach(product => {
        if (productCounts[product.id]) {
          productCounts[product.id].quantity += product.quantity;
          productCounts[product.id].total += product.preco * product.quantity;
        } else {
          productCounts[product.id] = { quantity: product.quantity, total: product.preco * product.quantity };
        }
  
        // Calculate total cost
        totalCost += product.custo * product.quantity;
      });
  
      if (sellerSales[venda.seller]) {
        sellerSales[venda.seller] += venda.totalValue;
      } else {
        sellerSales[venda.seller] = venda.totalValue;
      }
  
      if (venda.totalValue > maxSale.value) {
        maxSale = { value: venda.totalValue, venda };
      }
  
      // Contar as indicações
      if (venda.indicacao) {
        if (sponsorCounts[venda.indicacao]) {
          sponsorCounts[venda.indicacao] += 1;
        } else {
          sponsorCounts[venda.indicacao] = 1;
        }
      }
    });
  
    const mostSoldProduct = Object.entries(productCounts).reduce((acc, [id, { quantity, total }]) => {
      return quantity > (acc.quantity || 0) ? { id, quantity, total } : acc;
    }, {});
  
    const topSeller = Object.entries(sellerSales).reduce((acc, [seller, total]) => {
      return total > (acc.total || 0) ? { seller, total } : acc;
    }, {});
  
    // Calcular top patrocinadores
    const sortedSponsors = Object.entries(sponsorCounts)
      .sort(([, countA], [, countB]) => countB - countA) // Ordena do maior para o menor
      .slice(0, 3) // Pega os 3 primeiros
      .map(([name, count]) => ({ name, count }));
  
    // Logs para depuração
    console.log('Category Discounts:', categoryMap);
    console.log('Sales Data:', filteredVendas);
  
    // Verificar descontos e calcular lucro
    let adjustedTotalSales = 0;
    filteredVendas.forEach(venda => {
      let vendaTotal = venda.totalValue;
      if (venda.paymentMethod === 'Cartao de Credito') {
        venda.soldProducts.forEach(product => {
          console.log(product.nome + product.cor + product.quantity);
          const productCategoryId = product.categoria;
          const categoryDiscount = categoryMap[productCategoryId] || 0; // Valor fixo do desconto
          if (categoryDiscount) {
            console.log(`Product ${product.id} - Categoria ${productCategoryId} has discount of: ${categoryDiscount}`);
            const discountAmount = categoryDiscount * product.quantity; // Valor fixo total de desconto
            vendaTotal -= discountAmount;
            console.log(`Applied discount of ${discountAmount} to venda ${venda.id}`);
          } else {
            console.log(`No discount found for category ${product.categoria} of product ${product.id}`);
          }
        });
      }
      adjustedTotalSales += vendaTotal;
    });
  
    console.log('Adjusted Total Sales:', adjustedTotalSales);
  
    setReport({
      totalSales: adjustedTotalSales,
      totalCost,
      mostSoldProduct,
      maxSale: maxSale.venda,
      topSeller: topSeller.seller,
      topSponsors: sortedSponsors // Atualiza o relatório com os patrocinadores
    });
  };  

  const calculateProfit = () => {
    return report.totalSales - report.totalCost;
  };

  return (
    <div className="home-page">
      <Header />
      <div className="top-container">
        {/* Seletor removido para ignorar o filtro de seleção */}
      </div>
      <div className="container">
        <div className="left-container">
          <div className="card-container">
            <div className="card-homepage">
              <FontAwesomeIcon icon={faChartLine} className="icon" />
              <h3>Vendas</h3>
              <div className="card-content">
                <p>Total de Vendas: R$ {report.totalSales ? report.totalSales.toFixed(2) : 'R$ 0.00'}</p>
              </div>
            </div>
            <div className="card-homepage">
              <FontAwesomeIcon icon={faBox} className="icon" />
              <h3>Estoque</h3>
              <div className="card-content">
                Valor Total: R$ {totalEstoqueValue.toFixed(2)}
              </div>
            </div>
            <div className="card-homepage">
              <FontAwesomeIcon icon={faDollarSign} className="icon" />
              <h3>Lucro</h3>
              <div className="card-content">
                Lucro: R$ {calculateProfit().toFixed(2)}
              </div>
            </div>
          </div>
          <div className="card-homepage card-relatorio">
            <FontAwesomeIcon icon={faList} className="icon" />
            <h3>Relatório</h3>
            <div className="card-content">
              <p className="exibindo-text">
                Exibindo vendas do mês
              </p>
              <ul>
                <li><strong>Produto Mais Vendido:</strong> {report.mostSoldProduct?.id || 'N/A'}</li>
                <li><strong>Maior Venda:</strong> {report.maxSale ? `R$ ${report.maxSale.totalValue.toFixed(2)}` : 'N/A'}</li>
                <li><strong>Melhor Vendedor:</strong> {report.topSeller || 'N/A'}</li>
                <li><strong>Top Patrocinadores:</strong>
                  <ul>
                    {report.topSponsors.map(sponsor => (
                      <li key={sponsor.name}>{sponsor.name} ({sponsor.count} indicações)</li>
                    ))}
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-homepage card-encomendar">
        <h3>Encomendar {lowStockProducts.length}</h3>
          <div className="card-content-encomendas">
            {lowStockProducts.length > 0 ? (
              <ul>
                {lowStockProducts.map((produto, index) => (
                  <li key={index} className="card-produtos">
                    <img src={produto.imagem} alt={produto.nome} />
                    <div className="card-details">
                      <p>{produto.codigo}</p>
                    </div>
                    <div className="card-price">
                      <p>QTD: {produto.quantidade}</p>
                      <p>Custo: R$ {produto.precoCusto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sem produtos com estoque baixo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

     
