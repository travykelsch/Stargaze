"""Native GL shader checks; no browser, DOM, screenshot or device verification."""
import ctypes as C
import json
import sys

E=C.CDLL('libEGL.so.1'); G=C.CDLL('libGL.so.1')
P=C.c_void_p; I=C.c_int; U=C.c_uint
def fn(lib,name,result,args):
    f=getattr(lib,name); f.restype=result; f.argtypes=args; return f
address=fn(E,'eglGetProcAddress',P,[C.c_char_p])(b'eglGetPlatformDisplayEXT')
display=C.CFUNCTYPE(P,U,P,C.POINTER(I))(address)(0x31DD,None,None)
major=I(); minor=I()
assert fn(E,'eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])(display,C.byref(major),C.byref(minor))
fn(E,'eglBindAPI',U,[U])(0x30A2)
attrs=(I*9)(0x3033,1,0x3040,8,0x3024,8,0x3025,24,0x3038)
config=P(); count=I()
assert fn(E,'eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(display,attrs,C.byref(config),1,C.byref(count))
context=fn(E,'eglCreateContext',P,[P,P,P,C.POINTER(I)])(display,config,None,(I*1)(0x3038))
surface=fn(E,'eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(display,config,(I*5)(0x3057,1,0x3056,1,0x3038))
assert fn(E,'eglMakeCurrent',U,[P,P,P,P])(display,surface,surface,context)
create=fn(G,'glCreateShader',U,[U]); source=fn(G,'glShaderSource',None,[U,I,C.POINTER(C.c_char_p),P]); compile_shader=fn(G,'glCompileShader',None,[U]); status=fn(G,'glGetShaderiv',None,[U,U,C.POINTER(I)]); log=fn(G,'glGetShaderInfoLog',None,[U,I,P,P])
create_program=fn(G,'glCreateProgram',U,[]); attach=fn(G,'glAttachShader',None,[U,U]); link=fn(G,'glLinkProgram',None,[U]); link_status=fn(G,'glGetProgramiv',None,[U,U,C.POINTER(I)]); link_log=fn(G,'glGetProgramInfoLog',None,[U,I,P,P])
programs=json.load(sys.stdin)
for item in programs:
    program=create_program()
    for key,kind in [('vertex',0x8B31),('fragment',0x8B30)]:
        shader=create(kind); data=C.c_char_p(item[key].encode()); source(shader,1,C.byref(data),None); compile_shader(shader); ok=I(); status(shader,0x8B81,C.byref(ok))
        if not ok.value:
            message=C.create_string_buffer(8192); log(shader,8192,None,message)
            raise RuntimeError(item['name']+' '+key+': '+message.value.decode())
        attach(program,shader)
    link(program); ok=I(); link_status(program,0x8B82,C.byref(ok))
    if not ok.value:
        message=C.create_string_buffer(8192); link_log(program,8192,None,message)
        raise RuntimeError(item['name']+' link: '+message.value.decode())
print(f'PASS: {len(programs)} expanded material programs compile/link with instancing, surface maps, fog and ACES output.')
