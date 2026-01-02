import { useState } from 'react';

function MapaSVG({ lotes, onLoteClick, asignacionesPorLote }) {
  const [hoveredLote, setHoveredLote] = useState(null);

  const getTotalAnimales = (loteNombre) => {
    const asignaciones = asignacionesPorLote[loteNombre] || [];
    return asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
  };

  const getLoteColor = (loteNombre) => {
    const total = getTotalAnimales(loteNombre);
    if (total === 0) return '#f0f0f0';
    if (total < 50) return '#c8e6c9';
    if (total < 100) return '#81c784';
    return '#4caf50';
  };

  const lotesPaths = [
    // Lote 7A (extremo oeste - izquierda, agrandado)
    { 
      nombre: 'Lote 7A',
      path: 'M 20 320 L 117 320 L 117 580 L 20 580 Z',
      labelX: 68,
      labelY: 450
    },
    // Lote 7B (al lado derecho del 7A, agrandado)
    { 
      nombre: 'Lote 7B',
      path: 'M 117 320 L 215 320 L 215 580 L 117 580 Z',
      labelX: 166,
      labelY: 500
    },
    // Lote 8 (grande, a la derecha del lote 7)
    { 
      nombre: 'Lote 8',
      path: 'M 215 320 L 320 320 L 320 580 L 215 580 Z',
      labelX: 267,
      labelY: 450
    },
    // Lote 9 (centro - pared superior bajada a la mitad)
    { 
      nombre: 'Lote 9',
      path: 'M 320 450 L 490 450 L 490 580 L 320 580 Z',
      labelX: 405,
      labelY: 515
    },
    // Lote 10 (forma de L normal - parte vertical y horizontal)
    { 
      nombre: 'Lote 10',
      path: 'M 320 320 L 380 320 L 380 390 L 410 390 L 410 450 L 320 450 Z',
      labelX: 350,
      labelY: 385
    },
    // 11 A (superior izquierdo, pegado al monte)
    { 
      nombre: '11 A',
      path: 'M 380 320 L 440 320 L 440 390 L 380 390 Z',
      labelX: 410,
      labelY: 355
    },
    // 11 B (superior derecho, al lado del 11 A)
    { 
      nombre: '11 B',
      path: 'M 440 320 L 490 320 L 490 390 L 440 390 Z',
      labelX: 465,
      labelY: 355
    },
    // Lote 12 (inferior derecho, debajo de lotes 11)
    { 
      nombre: 'Lote 12',
      path: 'M 410 390 L 490 390 L 490 450 L 410 450 Z',
      labelX: 450,
      labelY: 420
    },
    // Monte (callejón verde - extendido, pegado a lotes)
    { 
      nombre: 'Monte',
      path: 'M 490 320 L 530 320 L 530 545 L 490 545 Z',
      labelX: 510,
      labelY: 430,
      isMonte: true,
      noClickeable: true
    },
    // Entrada (parte inferior del callejón - ícono de tranquera)
    { 
      nombre: 'Entrada',
      path: '',
      labelX: 515,
      labelY: 567,
      isEntrada: true,
      noClickeable: true
    },
    // Lote 1B (arriba izquierda, movido a la derecha)
    { 
      nombre: 'Lote 1B',
      path: 'M 530 320 L 615 320 L 615 430 L 530 430 Z',
      labelX: 572,
      labelY: 375
    },
    // Lote 1C (arriba derecha, movido a la derecha)
    { 
      nombre: 'Lote 1C',
      path: 'M 615 320 L 690 320 L 690 430 L 615 430 Z',
      labelX: 652,
      labelY: 375
    },
    // Lote 1A (abajo - unificado, movido a la derecha)
    { 
      nombre: 'Lote 1A',
      path: 'M 530 430 L 690 430 L 690 550 L 530 550 Z',
      labelX: 610,
      labelY: 490
    },
    // Lote 2 (derecha de lotes 1, unificado, movido a la derecha)
    { 
      nombre: 'Lote 2',
      path: 'M 690 320 L 850 320 L 850 550 L 690 550 Z',
      labelX: 770,
      labelY: 435
    },
    // Lote 4 (arriba centro, movido a la derecha)
    { 
      nombre: 'Lote 4',
      path: 'M 530 60 L 690 60 L 690 320 L 530 320 Z',
      labelX: 610,
      labelY: 190
    },
    // Lote 3 (arriba derecha - con laguna en esquina superior derecha, movido a la derecha)
    { 
      nombre: 'Lote 3',
      path: 'M 690 60 L 850 60 L 850 320 L 690 320 Z',
      labelX: 770,
      labelY: 190
    },
    // Laguna en Lote 3 (esquina superior derecha, ajustada)
    { 
      nombre: 'Laguna 3',
      path: 'M 810 80 L 840 80 L 840 120 L 810 120 Z',
      labelX: 825,
      labelY: 100,
      isLaguna: true,
      noClickeable: true
    },
    // Laguna grande en Lote 7B (centro/norte, casi toda la superficie)
    { 
      nombre: 'Laguna 7B',
      path: 'M 125 340 L 205 340 L 205 480 L 125 480 Z',
      labelX: 165,
      labelY: 410,
      isLaguna: true,
      noClickeable: true
    },
    // Laguna pequeña en sur centro de lotes 7A y 7B
    { 
      nombre: 'Laguna 7',
      path: 'M 50 520 L 100 520 L 100 560 L 50 560 Z',
      labelX: 75,
      labelY: 540,
      isLaguna: true,
      noClickeable: true
    },
    // Lote 5 (arriba centro-izquierda, pegado al lote 4)
    { 
      nombre: 'Lote 5',
      path: 'M 390 60 L 530 60 L 530 320 L 390 320 Z',
      labelX: 460,
      labelY: 190
    },
    // Lote 6 (pegado al lote 5, mismo alto, ancho moderado)
    { 
      nombre: 'Lote 6',
      path: 'M 270 60 L 390 60 L 390 320 L 270 320 Z',
      labelX: 330,
      labelY: 190
    }
  ];

  return (
    <svg 
      viewBox="0 0 900 650" 
      style={{ 
        width: '100%', 
        maxWidth: '1100px',
        height: 'auto',
        border: '2px solid #ddd',
        borderRadius: '8px',
        background: 'white'
      }}
    >
      {/* Título */}
      <text x="450" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#333">
        Establecimiento San José
      </text>
      <text x="450" y="48" textAnchor="middle" fontSize="12" fill="#666">
        Superficie Total: 562 Has. 75 As. 91 Cas.
      </text>

      {/* Lotes */}
      {lotesPaths.map((lote) => {
        const loteData = lotes.find(l => l.nombre === lote.nombre);
        const isHovered = hoveredLote === lote.nombre;
        const totalAnimales = getTotalAnimales(lote.nombre);
        
        // Color según tipo de área
        let fillColor = getLoteColor(lote.nombre);
        if (lote.isLaguna) fillColor = '#64b5f6';
        if (lote.isEntrada) fillColor = '#fff9c4';
        if (lote.isMonte) fillColor = '#66bb6a';
        if (lote.tieneCasa) fillColor = getLoteColor(lote.nombre);
        
        return (
          <g key={lote.nombre}>
            <path
              d={lote.path}
              fill={fillColor}
              stroke="#333"
              strokeWidth="2"
              style={{
                cursor: lote.noClickeable || lote.isEntrada ? 'default' : 'pointer',
                transition: 'all 0.2s',
                opacity: isHovered ? 0.8 : 1
              }}
              onMouseEnter={() => !lote.noClickeable && setHoveredLote(lote.nombre)}
              onMouseLeave={() => setHoveredLote(null)}
              onClick={() => !lote.noClickeable && !lote.isEntrada && loteData && onLoteClick(loteData)}
            />
            
            {/* Casa en Lote 1A */}
            {lote.tieneCasa && (
              <g>
                <rect x={lote.labelX - 15} y={lote.labelY - 35} width="30" height="20" fill="#ff9800" stroke="#333" strokeWidth="1" />
                <polygon points={`${lote.labelX - 18},${lote.labelY - 35} ${lote.labelX},${lote.labelY - 45} ${lote.labelX + 18},${lote.labelY - 35}`} fill="#d84315" stroke="#333" strokeWidth="1" />
                <text x={lote.labelX} y={lote.labelY - 48} textAnchor="middle" fontSize="10" fill="#333" style={{ pointerEvents: 'none' }}>🏠</text>
              </g>
            )}
            
            {/* Etiqueta del lote */}
            {!lote.noClickeable && !lote.isMonte && (
              <text
                x={lote.labelX}
                y={lote.labelY + (lote.tieneCasa ? 0 : -5)}
                textAnchor="middle"
                fontSize={lote.isEntrada ? "11" : "13"}
                fontWeight="bold"
                fill={lote.isEntrada ? "#666" : "#333"}
                style={{ pointerEvents: 'none' }}
              >
                {lote.isEntrada ? 'Entrada' : lote.nombre}
              </text>
            )}
            
            {/* Cantidad de animales */}
            {!lote.isLaguna && !lote.isEntrada && !lote.noClickeable && totalAnimales > 0 && (
              <text
                x={lote.labelX}
                y={lote.labelY + (lote.tieneCasa ? 15 : 12)}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#1976d2"
                style={{ pointerEvents: 'none' }}
              >
                🐄 {totalAnimales}
              </text>
            )}
            
            {/* Indicador de laguna */}
            {lote.isLaguna && !lote.noClickeable && (
              <text
                x={lote.labelX}
                y={lote.labelY}
                textAnchor="middle"
                fontSize="11"
                fill="#1565c0"
                style={{ pointerEvents: 'none' }}
              >
                Laguna
              </text>
            )}
            
            {/* Indicador de notas */}
            {loteData?.notas && !lote.isEntrada && (
              <text
                x={lote.labelX + 35}
                y={lote.labelY - 5}
                fontSize="14"
                style={{ pointerEvents: 'none' }}
              >
                📝
              </text>
            )}
          </g>
        );
      })}

      {/* Casa entre lotes 11 y 12 - versión simple */}
      <g>
        <text x="455" y="398" textAnchor="middle" fontSize="18" fill="#333" style={{ pointerEvents: 'none' }}>🏠</text>
      </g>

      {/* Entrada - rectángulo beige con texto debajo */}
      <g>
        {/* Fondo beige/crema */}
        <rect x="500" y="545" width="30" height="15" fill="#f5f5dc" stroke="#333" strokeWidth="1" rx="2" />
        {/* Texto ENTRADA debajo */}
        <text x="515" y="570" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#000" style={{ pointerEvents: 'none' }}>
          ENTRADA
        </text>
      </g>

      {/* Texto "MONTE" vertical dentro del rectángulo verde */}
      <g>
        <text x="510" y="360" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" style={{ pointerEvents: 'none' }}>M</text>
        <text x="510" y="380" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" style={{ pointerEvents: 'none' }}>O</text>
        <text x="510" y="400" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" style={{ pointerEvents: 'none' }}>N</text>
        <text x="510" y="420" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" style={{ pointerEvents: 'none' }}>T</text>
        <text x="510" y="440" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" style={{ pointerEvents: 'none' }}>E</text>
      </g>

      {/* Molino realista en la esquina superior derecha del Lote 1C */}
      <g>
        {/* Torre del molino (trapecio) */}
        <path d="M 677 340 L 685 340 L 683 325 L 679 325 Z" fill="#6d4c41" stroke="#333" strokeWidth="1" />
        {/* Plataforma superior */}
        <rect x="676" y="323" width="10" height="3" fill="#8d6e63" stroke="#333" strokeWidth="0.5" />
        {/* Aspas del molino - 4 palas en cruz */}
        <g transform="rotate(20 681 320)">
          {/* Pala 1 (arriba) */}
          <path d="M 680 320 L 678 305 L 684 305 L 682 320 Z" fill="#b0bec5" stroke="#333" strokeWidth="0.8" />
          {/* Pala 2 (derecha) */}
          <path d="M 681 320 L 696 318 L 696 322 L 681 320 Z" fill="#90a4ae" stroke="#333" strokeWidth="0.8" />
          {/* Pala 3 (abajo) */}
          <path d="M 680 320 L 678 335 L 684 335 L 682 320 Z" fill="#78909c" stroke="#333" strokeWidth="0.8" />
          {/* Pala 4 (izquierda) */}
          <path d="M 681 320 L 666 318 L 666 322 L 681 320 Z" fill="#b0bec5" stroke="#333" strokeWidth="0.8" />
        </g>
        {/* Centro del rotor */}
        <circle cx="681" cy="320" r="2" fill="#546e7a" stroke="#333" strokeWidth="0.5" />
      </g>

      {/* Molino realista en el vértice superior izquierdo del Lote 8 */}
      <g>
        {/* Torre del molino (trapecio) */}
        <path d="M 211 340 L 219 340 L 217 325 L 213 325 Z" fill="#6d4c41" stroke="#333" strokeWidth="1" />
        {/* Plataforma superior */}
        <rect x="210" y="323" width="10" height="3" fill="#8d6e63" stroke="#333" strokeWidth="0.5" />
        {/* Aspas del molino - 4 palas en cruz */}
        <g transform="rotate(45 215 320)">
          {/* Pala 1 (arriba) */}
          <path d="M 214 320 L 212 305 L 218 305 L 216 320 Z" fill="#b0bec5" stroke="#333" strokeWidth="0.8" />
          {/* Pala 2 (derecha) */}
          <path d="M 215 320 L 230 318 L 230 322 L 215 320 Z" fill="#90a4ae" stroke="#333" strokeWidth="0.8" />
          {/* Pala 3 (abajo) */}
          <path d="M 214 320 L 212 335 L 218 335 L 216 320 Z" fill="#78909c" stroke="#333" strokeWidth="0.8" />
          {/* Pala 4 (izquierda) */}
          <path d="M 215 320 L 200 318 L 200 322 L 215 320 Z" fill="#b0bec5" stroke="#333" strokeWidth="0.8" />
        </g>
        {/* Centro del rotor */}
        <circle cx="215" cy="320" r="2" fill="#546e7a" stroke="#333" strokeWidth="0.5" />
      </g>

      {/* Leyenda */}
      <g transform="translate(50, 610)">
        <text x="0" y="0" fontSize="13" fontWeight="bold" fill="#333">Leyenda:</text>
        
        <rect x="70" y="-10" width="20" height="14" fill="#f0f0f0" stroke="#333" />
        <text x="95" y="0" fontSize="11" fill="#666">Sin animales</text>
        
        <rect x="200" y="-10" width="20" height="14" fill="#c8e6c9" stroke="#333" />
        <text x="225" y="0" fontSize="11" fill="#666">1-49</text>
        
        <rect x="290" y="-10" width="20" height="14" fill="#81c784" stroke="#333" />
        <text x="315" y="0" fontSize="11" fill="#666">50-99</text>
        
        <rect x="380" y="-10" width="20" height="14" fill="#4caf50" stroke="#333" />
        <text x="405" y="0" fontSize="11" fill="#666">100+</text>
        
        <rect x="470" y="-10" width="20" height="14" fill="#64b5f6" stroke="#333" />
        <text x="495" y="0" fontSize="11" fill="#666">Laguna</text>
        
        <text x="565" y="0" fontSize="14" fill="#333">🏠</text>
        <text x="585" y="0" fontSize="11" fill="#666">Casa</text>
        
        {/* Entrada en leyenda */}
        <rect x="645" y="-10" width="20" height="14" fill="#f5f5dc" stroke="#333" />
        <text x="670" y="0" fontSize="11" fill="#666">Entrada</text>
        
        {/* Molino en leyenda */}
        <g transform="translate(740, -10)">
          {/* Torre del molino */}
          <path d="M 2 14 L 6 14 L 5.5 6 L 2.5 6 Z" fill="#6d4c41" stroke="#333" strokeWidth="0.5" />
          {/* Plataforma */}
          <rect x="1.5" y="5.5" width="5" height="1" fill="#8d6e63" stroke="#333" strokeWidth="0.3" />
          {/* Aspas */}
          <g transform="rotate(20 4 5)">
            <path d="M 3.5 5 L 3 2 L 5 2 L 4.5 5 Z" fill="#b0bec5" stroke="#333" strokeWidth="0.4" />
            <path d="M 4 5 L 7 4.5 L 7 5.5 L 4 5 Z" fill="#90a4ae" stroke="#333" strokeWidth="0.4" />
            <path d="M 3.5 5 L 3 8 L 5 8 L 4.5 5 Z" fill="#78909c" stroke="#333" strokeWidth="0.4" />
            <path d="M 4 5 L 1 4.5 L 1 5.5 L 4 5 Z" fill="#b0bec5" stroke="#333" strokeWidth="0.4" />
          </g>
          <circle cx="4" cy="5" r="0.8" fill="#546e7a" stroke="#333" strokeWidth="0.3" />
        </g>
        <text x="755" y="0" fontSize="11" fill="#666">Molino</text>
        
        <rect x="30" y="15" width="20" height="14" fill="#66bb6a" stroke="#333" />
        <text x="55" y="25" fontSize="11" fill="#666">Monte</text>
      </g>
    </svg>
  );
}

export default MapaSVG;
