/**
 * API Newsletter - Portal Paranavaí News
 * Endpoint para cadastrar usuários na newsletter
 */

import { supabase } from '../utils/supabase-client.js';

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Responder OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            return await cadastrarNewsletter(req, res);
        } else if (req.method === 'GET') {
            return await listarInscritos(req, res);
        } else {
            return res.status(405).json({
                success: false,
                error: 'Método não permitido'
            });
        }
    } catch (error) {
        console.error('❌ Erro na API Newsletter:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
}

async function cadastrarNewsletter(req, res) {
    const { nome, email, whatsapp } = req.body;

    // Validações
    if (!nome || !email) {
        return res.status(400).json({
            success: false,
            error: 'Nome e email são obrigatórios'
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Email inválido'
        });
    }

    if (whatsapp && !isValidWhatsApp(whatsapp)) {
        return res.status(400).json({
            success: false,
            error: 'WhatsApp deve conter apenas números (com DDD)'
        });
    }

    try {
        // Verificar se email já existe
        const { data: emailExists, error: checkError } = await supabase
            .from('newsletter')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Erro ao verificar email existente:', checkError);
            throw checkError;
        }

        if (emailExists) {
            return res.status(409).json({
                success: false,
                error: 'Este email já está cadastrado na nossa newsletter'
            });
        }

        // Inserir novo cadastro
        const { data, error } = await supabase
            .from('newsletter')
            .insert([{
                nome: nome.trim(),
                email: email.toLowerCase().trim(),
                whatsapp: whatsapp ? formatWhatsApp(whatsapp) : null,
                ativo: true,
                data_cadastro: new Date().toISOString(),
                ip_cadastro: getClientIP(req),
                user_agent: req.headers['user-agent'] || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao inserir na newsletter:', error);
            throw error;
        }

        console.log(`✅ Newsletter cadastrada: ${email}`);

        return res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso! Você receberá nossas notícias no seu email.',
            data: {
                id: data.id,
                nome: data.nome,
                email: data.email,
                whatsapp: data.whatsapp,
                data_cadastro: data.data_cadastro
            }
        });

    } catch (error) {
        console.error('❌ Erro ao cadastrar newsletter:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao processar cadastro. Tente novamente.'
        });
    }
}

async function listarInscritos(req, res) {
    try {
        const { data, error, count } = await supabase
            .from('newsletter')
            .select('id, nome, email, whatsapp, ativo, data_cadastro', { count: 'exact' })
            .eq('ativo', true)
            .order('data_cadastro', { ascending: false });

        if (error) {
            console.error('Erro ao listar inscritos:', error);
            throw error;
        }

        return res.status(200).json({
            success: true,
            total: count,
            inscritos: data,
            estatisticas: {
                total_ativos: count,
                cadastros_hoje: data.filter(item => {
                    const hoje = new Date().toDateString();
                    const dataCadastro = new Date(item.data_cadastro).toDateString();
                    return hoje === dataCadastro;
                }).length
            }
        });

    } catch (error) {
        console.error('❌ Erro ao listar inscritos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao carregar lista de inscritos'
        });
    }
}

// Funções auxiliares
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidWhatsApp(whatsapp) {
    // Remove todos os caracteres não numéricos
    const numbers = whatsapp.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 15 dígitos (padrões internacionais)
    return numbers.length >= 10 && numbers.length <= 15;
}

function formatWhatsApp(whatsapp) {
    // Remove todos os caracteres não numéricos
    const numbers = whatsapp.replace(/\D/g, '');
    
    // Se não tem código do país, adiciona 55 (Brasil)
    if (numbers.length === 11 || numbers.length === 10) {
        return `55${numbers}`;
    }
    
    return numbers;
}

function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.connection?.socket?.remoteAddress ||
           '127.0.0.1';
}
