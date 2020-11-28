// Remove perf timing statements from build
module.exports = function (program, cfg, { ts }) {
  return (ctx) => {
    return function visit(node) {
      if (!cfg.enable) return node;
      if (
        ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) &&
        [ 'perfStart', 'perfStop' ].includes(node.expression.expression.text)
      )
        return undefined;

      return ts.visitEachChild(node, visit, ctx);
    }
  }
}
