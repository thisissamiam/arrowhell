const grammar = {
  Lexer: undefined,
  ParserRules: [
    {"name":"main","symbols":["statement"],"postprocess":d=>[d[0]]},
    {"name":"main","symbols":["main","statement"],"postprocess":d=>d[0].concat([d[1]])},

    {"name":"statement","symbols":["loop"],"postprocess":d=>d[0]},
    {"name":"statement","symbols":["assign"],"postprocess":d=>d[0]},
    {"name":"statement","symbols":["varPrint"],"postprocess":d=>d[0]},
    {"name":"statement","symbols":["print"],"postprocess":d=>d[0]},

    {"name":"loop","symbols":["arrows",{"literal":"["},"main",{"literal":"]"}],
      "postprocess":d=>({type:'loop',count:d[0],body:d[2]})},

    {"name":"assign","symbols":["arrows",{"literal":"-=>"},"value"],
      "postprocess":d=>({type:'assign',varIndex:d[0],value:d[2]})},

    {"name":"varPrint","symbols":["arrows",{"literal":"->"}],
      "postprocess":d=>({type:'varPrint',varIndex:d[0]})},

    {"name":"print","symbols":["arrows","dots"],
      "postprocess":d=>({type:'print',arrows:d[0],dots:d[1]})},

    {"name":"arrows","symbols":[{"literal":">"}],"postprocess":()=>1},
    {"name":"arrows","symbols":[{"literal":">"},"arrows"],"postprocess":d=>d[1]+1},

    {"name":"dots","symbols":[{"literal":"."}],"postprocess":()=>1},
    {"name":"dots","symbols":[{"literal":"."},"dots"],"postprocess":d=>d[1]+1},

    {"name":"value","symbols":["dots"],"postprocess":d=>d[0]}
  ],
  ParserStart:"main"
};
