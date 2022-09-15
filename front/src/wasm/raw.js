import base64 from './base64.json';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
/**
*/
export function init_hook() {
    wasm.init_hook();
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
* @param {Uint8Array} pool
* @param {Uint8Array} board
* @param {string} seed
* @returns {Uint8Array}
*/
export function get_catalog(pool, board, seed) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(pool, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(seed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        wasm.get_catalog(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

let cachedUint16Memory0 = new Uint16Array();

function getUint16Memory0() {
    if (cachedUint16Memory0.byteLength === 0) {
        cachedUint16Memory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16Memory0;
}

function passArray16ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 2);
    getUint16Memory0().set(arg, ptr / 2);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
* @param {Uint16Array} selected_built_base_ids
* @param {Uint8Array} emo_bases
* @param {Uint16Array} fixed_base_ids
* @param {Uint16Array} built_base_ids
* @returns {Uint8Array}
*/
export function build_pool(selected_built_base_ids, emo_bases, fixed_base_ids, built_base_ids) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray16ToWasm0(selected_built_base_ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(emo_bases, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray16ToWasm0(fixed_base_ids, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray16ToWasm0(built_base_ids, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        wasm.build_pool(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} board
* @param {string} seed
* @param {Uint8Array} emo_bases
* @returns {Uint8Array}
*/
export function start_shop(board, seed, emo_bases) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(seed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(emo_bases, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        wasm.start_shop(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} board
* @param {Uint16Array} mtc_emo_ids
* @param {number} base_id
* @param {boolean} is_triple
* @param {number} emo_index
* @param {Uint8Array} emo_bases
* @returns {Uint8Array}
*/
export function add_emo(board, mtc_emo_ids, base_id, is_triple, emo_index, emo_bases) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray16ToWasm0(mtc_emo_ids, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(emo_bases, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        wasm.add_emo(retptr, ptr0, len0, ptr1, len1, base_id, is_triple, emo_index, ptr2, len2);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v3 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} board
* @param {number} emo_index
* @param {Uint8Array} emo_bases
* @returns {Uint8Array}
*/
export function sell_emo(board, emo_index, emo_bases) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(emo_bases, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.sell_emo(retptr, ptr0, len0, emo_index, ptr1, len1);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} board
* @param {number} emo_index
* @param {boolean} is_right
* @returns {Uint8Array}
*/
export function move_emo(board, emo_index, is_right) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.move_emo(retptr, ptr0, len0, emo_index, is_right);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {number} turn
* @returns {number}
*/
export function get_initial_coin_by_turn(turn) {
    const ret = wasm.get_initial_coin_by_turn(turn);
    return ret;
}

/**
* @param {number} grade
* @returns {number | undefined}
*/
export function get_upgrade_coin(grade) {
    const ret = wasm.get_upgrade_coin(grade);
    return ret === 0xFFFFFF ? undefined : ret;
}

/**
* @param {Uint8Array} states
* @param {number} previous_index
* @param {string} seed
* @returns {number}
*/
export function select_battle_ghost_index(states, previous_index, seed) {
    const ptr0 = passArray8ToWasm0(states, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(seed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.select_battle_ghost_index(ptr0, len0, previous_index, ptr1, len1);
    return ret;
}

/**
* @param {Uint8Array} board
* @param {Uint8Array} ghost_board
* @param {string} seed
* @param {Uint8Array} emo_bases
* @returns {Uint8Array}
*/
export function march_pvg(board, ghost_board, seed, emo_bases) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ghost_board, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(seed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray8ToWasm0(emo_bases, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        wasm.march_pvg(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} board
* @param {number} grade
* @param {number} health
* @param {Uint8Array} ghosts
* @param {Uint8Array} ghost_states
* @param {number} battle_ghost_index
* @param {number} turn
* @param {string} seed
* @param {Uint8Array} emo_bases
* @returns {Uint8Array}
*/
export function battle_all(board, grade, health, ghosts, ghost_states, battle_ghost_index, turn, seed, emo_bases) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ghosts, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(ghost_states, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(seed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray8ToWasm0(emo_bases, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        wasm.battle_all(retptr, ptr0, len0, grade, health, ptr1, len1, ptr2, len2, battle_ghost_index, turn, ptr3, len3, ptr4, len4);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v5 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v5;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} grade_and_ghost_boards
* @param {Uint8Array} ghost_state
* @param {number} turn
* @returns {Uint8Array}
*/
export function get_grade_and_ghost_board(grade_and_ghost_boards, ghost_state, turn) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(grade_and_ghost_boards, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ghost_state, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.get_grade_and_ghost_board(retptr, ptr0, len0, ptr1, len1, turn);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {number} grade
* @returns {number}
*/
export function get_pool_emo_count_by_grade(grade) {
    const ret = wasm.get_pool_emo_count_by_grade(grade);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

export function __wbg_log_682923c8ea4d4d53(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
};

export function __wbg_new_693216e109162396() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_0ddaca5d1abfb52f(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_error_09919627ac0992f5(arg0, arg1) {
    try {
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};


const imports = { '__wbindgen_placeholder__': { __wbg_log_682923c8ea4d4d53, __wbg_new_693216e109162396, __wbg_stack_0ddaca5d1abfb52f, __wbg_error_09919627ac0992f5, __wbindgen_object_drop_ref } };
let wasm;
export const init = async () => {
  if (wasm) {
    return;
  }

  const _wasm = await WebAssembly.instantiate(Buffer.from(base64, 'base64'), imports);
  wasm = _wasm.instance.exports;

  wasm.init_hook();
};
