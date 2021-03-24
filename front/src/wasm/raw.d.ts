/* tslint:disable */
/* eslint-disable */
/**
*/
export function init_hook(): void;
/**
* @param {Uint8Array} pool 
* @param {Uint8Array} board 
* @param {BigInt} seed 
* @returns {Uint8Array} 
*/
export function get_catalog(pool: Uint8Array, board: Uint8Array, seed: BigInt): Uint8Array;
/**
* @param {Uint16Array} selected_built_base_ids 
* @param {Uint8Array} emo_bases 
* @param {Uint16Array} fixed_base_ids 
* @param {Uint16Array} built_base_ids 
* @returns {Uint8Array} 
*/
export function build_pool(selected_built_base_ids: Uint16Array, emo_bases: Uint8Array, fixed_base_ids: Uint16Array, built_base_ids: Uint16Array): Uint8Array;
/**
* @param {Uint8Array} board 
* @param {BigInt} seed 
* @param {Uint8Array} emo_bases 
* @returns {Uint8Array} 
*/
export function start_shop(board: Uint8Array, seed: BigInt, emo_bases: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} board 
* @param {Uint16Array} mtc_emo_ids 
* @param {number} base_id 
* @param {boolean} is_triple 
* @param {number} emo_index 
* @param {Uint8Array} emo_bases 
* @returns {Uint8Array} 
*/
export function add_emo(board: Uint8Array, mtc_emo_ids: Uint16Array, base_id: number, is_triple: boolean, emo_index: number, emo_bases: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} board 
* @param {number} emo_index 
* @param {Uint8Array} emo_bases 
* @returns {Uint8Array} 
*/
export function sell_emo(board: Uint8Array, emo_index: number, emo_bases: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} board 
* @param {number} emo_index 
* @param {boolean} is_right 
* @returns {Uint8Array} 
*/
export function move_emo(board: Uint8Array, emo_index: number, is_right: boolean): Uint8Array;
/**
* @param {number} turn 
* @returns {number} 
*/
export function get_initial_coin_by_turn(turn: number): number;
/**
* @param {number} grade 
* @returns {number | undefined} 
*/
export function get_upgrade_coin(grade: number): number | undefined;
/**
* @param {Uint8Array} states 
* @param {number} previous_index 
* @param {BigInt} seed 
* @returns {number} 
*/
export function select_battle_ghost_index(states: Uint8Array, previous_index: number, seed: BigInt): number;
/**
* @param {Uint8Array} board 
* @param {Uint8Array} ghost_board 
* @param {BigInt} seed 
* @param {Uint8Array} emo_bases 
* @returns {Uint8Array} 
*/
export function march_pvg(board: Uint8Array, ghost_board: Uint8Array, seed: BigInt, emo_bases: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} board 
* @param {number} grade 
* @param {number} health 
* @param {Uint8Array} ghosts 
* @param {Uint8Array} ghost_states 
* @param {number} battle_ghost_index 
* @param {number} turn 
* @param {BigInt} seed 
* @param {Uint8Array} emo_bases 
* @returns {Uint8Array} 
*/
export function battle_all(board: Uint8Array, grade: number, health: number, ghosts: Uint8Array, ghost_states: Uint8Array, battle_ghost_index: number, turn: number, seed: BigInt, emo_bases: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} grade_and_ghost_boards 
* @param {Uint8Array} ghost_state 
* @param {number} turn 
* @returns {Uint8Array} 
*/
export function get_grade_and_ghost_board(grade_and_ghost_boards: Uint8Array, ghost_state: Uint8Array, turn: number): Uint8Array;
/**
* @param {number} grade 
* @returns {number} 
*/
export function get_pool_emo_count_by_grade(grade: number): number;

export function init(): Promise<void>;
