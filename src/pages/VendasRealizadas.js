import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../Firebase';
import Header from '../components/Header';
import { FaChevronDown, FaChevronUp, FaFileInvoice } from 'react-icons/fa';
import './VendasRealizadas.css';

const VendasRealizadas = () => {
  const [vendas, setVendas] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [expandedVendas, setExpandedVendas] = useState({});
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isShowingMonth, setIsShowingMonth] = useState(true);

  useEffect(() => {
    const fetchVendas = async () => {
      const vendasCollection = collection(db, 'vendas');
      const q = query(vendasCollection, orderBy('saleTime', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const vendasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendas(vendasData);
    };

    fetchVendas();
  }, []);

  const organizeVendasByDate = (vendas) => {
    const organizedData = {};
    
    vendas.forEach((venda) => {
      const vendaDate = new Date(venda.saleTime.seconds * 1000);
      const year = vendaDate.getFullYear();
      const month = vendaDate.getMonth() + 1;
      const day = vendaDate.getDate();

      if (!organizedData[year]) organizedData[year] = {};
      if (!organizedData[year][month]) organizedData[year][month] = {};
      if (!organizedData[year][month][day]) organizedData[year][month][day] = [];

      organizedData[year][month][day].push(venda);
    });

    return organizedData;
  };

  const filterVendasByMonth = (vendas, year, month) => {
    return vendas.filter(venda => {
      const vendaDate = new Date(venda.saleTime.seconds * 1000);
      return vendaDate.getFullYear() === year && (vendaDate.getMonth() + 1) === month;
    });
  };

  const toggleExpand = (vendaId) => {
    setExpandedVendas(prevState => ({
      ...prevState,
      [vendaId]: !prevState[vendaId]
    }));
  };

  const printNotaFiscal = (venda) => {
    // Implementação da função de impressão
    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
      <head>
        <title>Comprovante de Venda</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container { width: 100%; max-width: 1000px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .section { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
          .section h2 { margin-top: 0; font-size: 20px; }
          .section p { margin: 5px 0; }
          .section strong { font-weight: bold; }
          .products { margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
          .products p { margin: 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Comprovante de Venda</h1>
          </div>
          <div class="section">
            <h2>Detalhes da Venda</h2>
            <p><strong>Data:</strong> ${new Date(venda.saleTime.seconds * 1000).toLocaleString()}</p>
            <p><strong>Valor Total:</strong> R$ ${venda.totalValue.toFixed(2)}</p>
            <p><strong>Forma de Pagamento:</strong> ${venda.paymentMethod}</p>
            <p><strong>Indicação:</strong> ${venda.indicacao}</p>
            <p><strong>Funcionário:</strong> ${venda.seller}</p>
          </div>
          <div class="section products">
            <h2>Produtos Vendidos</h2>
            ${venda.soldProducts.map(p => `
              <p>${p.nome} ${p.cor} | Tamanho: ${p.tamanho} (${p.id}) - ${p.preco} R$ x${p.quantity}</p>
            `).join('')}
          </div>
          <div class="section">
            <h2>Dados do Cliente</h2>
            ${venda.cliente ? `
              <p><strong>Nome:</strong> ${venda.cliente.nome}</p>
              <p><strong>CPF:</strong> ${venda.cliente.cpf}</p>
              <p><strong>Endereço:</strong> ${venda.cliente.endereco}</p>
              <p><strong>Cidade:</strong> ${venda.cliente.cidade}</p>
              <p><strong>Estado:</strong> ${venda.cliente.estado}</p>
              <p><strong>CEP:</strong> ${venda.cliente.cep}</p>
            ` : '<p>Dados do Cliente não disponíveis</p>'}
          </div>
          <div class="footer">
            <p>Obrigado por comprar conosco!</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const renderVendas = (vendasData, isShowingMonth) => {
    const yearOptions = Object.keys(vendasData).sort((a, b) => b - a);
    const vendasForSelectedYear = vendasData[selectedYear] || {};
    const vendasToShow = isShowingMonth ? filterVendasByMonth(vendas, currentYear, currentMonth) : vendas;

    const vendasGroupedByDay = vendasToShow.reduce((acc, venda) => {
      const vendaDate = new Date(venda.saleTime.seconds * 1000);
      const day = vendaDate.getDate();
      const month = vendaDate.getMonth() + 1;
      const key = `${day}-${month}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(venda);
      return acc;
    }, {});

    return (
      <div>
        <div className="year-selector">
          <label htmlFor="year-select">Selecione o ano:</label>
          <select id="year-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        {isShowingMonth ? (
          <div className="month-section">
            <h3>{monthNames[currentMonth - 1]} ({vendasToShow.length} vendas)</h3>
            {Object.entries(vendasGroupedByDay).sort(([a], [b]) => b - a).map(([key, vendas]) => {
              const [day, month] = key.split('-');
              return (
                <div key={key} className="day-section">
                  <h4>{`${day} de ${monthNames[month - 1]}`}</h4>
                  <ul>
                    {vendas.map(venda => (
                      <li key={venda.id} className="venda-item">
                        <p>
                          Produtos:<br/> {venda.soldProducts.map((p, index) => (
                            <React.Fragment key={index}>
                              {p.nome} {p.cor} | Tamanho: {p.tamanho} ({p.id}) - {p.preco} R$ x{p.quantity}
                              {index < venda.soldProducts.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                        <button onClick={() => toggleExpand(venda.id)} className="expand-button">
                          {expandedVendas[venda.id] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        <button onClick={() => printNotaFiscal(venda)} className="invoice-button">
                          <FaFileInvoice />
                        </button>
                        {expandedVendas[venda.id] && (
                          <div className="venda-details">
                            <p><strong>Valor Total:</strong>R$ {venda.totalValue.toFixed(2)}</p>
                            <p><strong>Desconto: </strong>{venda.discount}%</p>
                            <p><strong>Indicação:</strong> {venda.indicacao}</p>
                            <p><strong>Funcionário:</strong> {venda.seller}</p>
                            <p><strong>Forma de Pagamento:</strong> {venda.paymentMethod}</p>
                            <p><strong>Data:</strong> {new Date(venda.saleTime.seconds * 1000).toLocaleString()}</p>
                            <h2>Dados do Cliente:</h2>
                              {venda.cliente ? (
                                <>
                                  <p><strong>Nome:</strong> {venda.cliente.nome}</p>
                                  <p><strong>CPF:</strong> {venda.cliente.cpf}</p>
                                  <p><strong>Endereço:</strong> {venda.cliente.endereco}</p>
                                  <p><strong>Cidade:</strong> {venda.cliente.cidade}</p>
                                  <p><strong>Estado:</strong> {venda.cliente.estado}</p>
                                  <p><strong>CEP:</strong> {venda.cliente.cep}</p>
                                </>
                              ) : (
                                <p>Dados do Cliente não disponíveis</p>
                              )}
                            </div>
                          )}       
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          Object.entries(vendasForSelectedYear).sort(([a], [b]) => b - a).map(([month, days]) => (
            <div key={month} className="month-section">
              <h3>{monthNames[month - 1]}</h3>
              {Object.entries(days).sort(([a], [b]) => b - a).map(([day, vendas]) => (
                <div key={day} className="day-section">
                  <h4>{`${day} de ${monthNames[month - 1]}`}</h4>
                  <ul>
                    {vendas.map(venda => (
                      <li key={venda.id} className="venda-item">
                        <p>
                          Produtos:<br/> {venda.soldProducts.map((p, index) => (
                            <React.Fragment key={index}>
                              {p.nome} {p.cor} | Tamanho: {p.tamanho} ({p.id}) - {p.preco} R$ x{p.quantity}
                              {index < venda.soldProducts.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                        <button onClick={() => toggleExpand(venda.id)} className="expand-button">
                          {expandedVendas[venda.id] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        <button onClick={() => printNotaFiscal(venda)} className="invoice-button">
                          <FaFileInvoice />
                        </button>
                        {expandedVendas[venda.id] && (
                          <div className="venda-details">
                            <p>Valor Total: R$ {venda.totalValue.toFixed(2)}</p>
                            <p>Desconto: {venda.discount}%</p>
                            <p>Indicação: {venda.indicacao}</p>
                            <p>Funcionário: {venda.seller}</p>
                            <p>Data: {new Date(venda.saleTime.seconds * 1000).toLocaleString()}</p>
                            <h2>Dados do Cliente:</h2>
                              {venda.cliente ? (
                                <>
                                  <p><strong>Nome:</strong> {venda.cliente.nome}</p>
                                  <p><strong>CPF:</strong> {venda.cliente.cpf}</p>
                                  <p><strong>Endereço:</strong> {venda.cliente.endereco}</p>
                                  <p><strong>Cidade:</strong> {venda.cliente.cidade}</p>
                                  <p><strong>Estado:</strong> {venda.cliente.estado}</p>
                                  <p><strong>CEP:</strong> {venda.cliente.cep}</p>
                                </>
                              ) : (
                                <p>Dados do Cliente não disponíveis</p>
                              )}
                            </div>
                          )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    );
  };

  const organizedVendas = organizeVendasByDate(vendas);

  return (
    <div>
      <Header />
      <div className="vendasRealizadas-container">
        <div className="header-section">
          <h1>Vendas Realizadas</h1>
          {isShowingMonth && <p className="vendas-count">{filterVendasByMonth(vendas, currentYear, currentMonth).length} vendas</p>}
        </div>
        {renderVendas(organizedVendas, isShowingMonth)}
        <p className="exibindo-text">{isShowingMonth ? 'Exibindo vendas do mês' : 'Exibindo vendas do ano selecionado'}</p>
        {!showMore && (
          <button onClick={() => { setShowMore(true); setIsShowingMonth(false); }} className="load-more-button">
            Ver mais <FaChevronDown />
          </button>
        )}
      </div>
    </div>
  );
};

export default VendasRealizadas;
