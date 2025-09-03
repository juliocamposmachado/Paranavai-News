#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de imagens placeholder para o Portal Paranavaí News
"""

import os
from pathlib import Path

def create_svg_placeholder(width, height, text, filename, bg_color="#1e4a73", text_color="#ffffff"):
    """Cria um placeholder SVG"""
    svg_content = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="{bg_color}"/>
    <text x="50%" y="50%" fill="{text_color}" text-anchor="middle" 
          dominant-baseline="middle" font-family="Arial, sans-serif" 
          font-size="{min(width, height) // 15}" font-weight="bold">
        {text}
    </text>
</svg>'''
    
    # Criar diretório se não existir
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Criado: {filename}")

def main():
    base_path = "assets/images"
    
    # Imagens principais
    images_to_create = [
        # Equipe
        (200, 200, "Dr. Leônidas", f"{base_path}/dr-leonidas.jpg", "#1e4a73"),
        (200, 200, "Dr. Leônidas", f"{base_path}/dr-leonidas-full.jpg", "#1e4a73"),
        (200, 200, "Matheus Lima", f"{base_path}/matheus-lima.jpg", "#2c5f8a"),
        (200, 200, "Matheus Lima", f"{base_path}/matheus-lima-portrait.jpg", "#2c5f8a"),
        
        # Notícias principais
        (800, 400, "Assembleia Legislativa", f"{base_path}/leonidas-assembleia.jpg", "#1e4a73"),
        (800, 400, "Assembleia - Principal", f"{base_path}/leonidas-assembleia-main.jpg", "#1e4a73"),
        (600, 300, "Agronegócio PR", f"{base_path}/agronegocio-parana.jpg", "#2e7d32"),
        (600, 300, "Hospital Regional", f"{base_path}/hospital-parana.jpg", "#d32f2f"),
        
        # Política
        (600, 300, "Assembleia PR", f"{base_path}/assembleia-parana.jpg", "#1e4a73"),
        (600, 300, "Prefeitura", f"{base_path}/prefeitura-paranavai.jpg", "#2c5f8a"),
        (600, 300, "Recursos Federais", f"{base_path}/recursos-federais.jpg", "#2e7d32"),
        
        # Portfólio Matheus
        (400, 300, "Fotografia Sensual", f"{base_path}/portfolio/fotografia-sensual.jpg", "#e91e63"),
        (400, 300, "Food Photography", f"{base_path}/portfolio/fotografia-alimentos.jpg", "#ff9800"),
        (400, 300, "Eventos", f"{base_path}/portfolio/eventos.jpg", "#9c27b0"),
        (400, 300, "Retratos", f"{base_path}/portfolio/retratos.jpg", "#3f51b5"),
        
        # Categorias adicionais
        (600, 300, "Saúde Regional", f"{base_path}/saude-regional.jpg", "#d32f2f"),
        (600, 300, "Turismo PR", f"{base_path}/turismo-parana.jpg", "#00bcd4"),
        (600, 300, "Agricultura", f"{base_path}/agricultura-regional.jpg", "#4caf50"),
    ]
    
    for width, height, text, filename, bg_color in images_to_create:
        create_svg_placeholder(width, height, text, filename, bg_color)
    
    print(f"\n✅ Total de {len(images_to_create)} imagens placeholder criadas!")
    print("📝 Substitua os arquivos .jpg por suas imagens reais quando disponível")

if __name__ == "__main__":
    main()
