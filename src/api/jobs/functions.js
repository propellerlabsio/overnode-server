/* Ignore camel case requirement for function names.  These names are visible */
/* to non-programmers:                                                        */
/* eslint-disable camelcase                                                   */

import populate_block_table from './populate_block_table';
import sync_transaction from './sync_transaction';

const functions = {
  populate_block_table,
  sync_transaction,
};

export default functions;
