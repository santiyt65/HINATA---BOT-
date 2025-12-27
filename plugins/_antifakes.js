import db from '../lib/database.js'

// Mensaje de activación en consola
console.log('\x1b[36m%s\x1b[0m', '==============================');
console.log('\x1b[32m%s\x1b[0m', '   HINATA-BOT-MD ACTIVADO');
console.log('\x1b[33m%s\x1b[0m', '   CREADOR: santiyt65');
console.log('\x1b[36m%s\x1b[0m', '==============================');
let handler = m => m
handler.before = async function (m, {conn, isAdmin, isBotAdmin} ) {
if (!m.isGroup) return !1
let chat = global.db.data.chats[m.chat]
if (isBotAdmin && chat.antifake) {
if (m.sender.startsWith('6' || '6')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('90' || '90')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('212' || '212')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('92' || '92')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('93' || '93')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('94' || '94')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('7' || '7')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('49' || '49')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('2' || '2')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('91' || '91')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')}
if (m.sender.startsWith('48' || '48')) {
global.db.data.users[m.sender].block = true

await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')} 
}}
export default handler