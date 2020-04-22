import traceback
import os, sys, json
import copy

class Node(object):
    def __init__(self,text, *args ,**kw):
        self.id = None
        self.text = text
        self.kw = kw
        self.subnodes = None
        self.testings = None
        self.benchmarks = None
        self.isTopNode = False
        for arg in args:
            self.add(arg)
        
        if self.kw.get('testings'):
            if self.testings is None: self.testings = []
            if isinstance(self.kw['testings'],Testing):
                self.testings.append(self.kw['testings'])
            else:
                self.testings.extend(self.kw['testings'])
            del self.kw['testings'] #move testings out of self.kw

        if self.kw.get('benchmarks'):
            if self.benchmarks is None: self.benchmarks = []
            if isinstance(self.kw['benchmarks'],Benchmark):
                self.benchmarks.append(self.kw['benchmarks'])
            else:
                self.benchmarks.extend(self.kw['benchmarks'])
            del self.kw['benchmarks'] #move benchmarks out of self.kw

    def serialize(self):
        data = copy.deepcopy(self.kw)
        data.update({
            'text':self.text,
            'id':self.id or self.text,
        })

        # let w2ui sidebar to take this node as a group node
        if self.isTopNode and self.subnodes is not None: data['group'] = True

        if self.subnodes is not None:
            data['nodes'] = [n.serialize() for n in self.subnodes]
            if data.get('expanded') is None: data['expanded'] = True
        if self.testings is not None:
            data['testings'] = []
            for idx, t in enumerate(self.testings):
                ts = t.serialize()
                if not ts.get('priority'):
                    ts['priority'] = idx
                data['testings'].append(ts)

        if self.benchmarks is not None:
            data['benchmarks'] = [b.serialize() for b in self.benchmarks]

        # set default icon
        if data.get('img') is None:
            data['img'] = 'fas fa-vial' if self.subnodes is None else 'fas fa-folder'
        
        return data

    def add(self,node):
        if isinstance(node, Node):
            if self.subnodes is None:  self.subnodes = []
            self.subnodes.append(node)
        elif isinstance(node, Testing):
            if self.testings is None: self.testings = []
            self.testings.append(node)
        elif isinstance(node, Benchmark):
            if self.benchmarks is None: self.benchmarks = []
            self.testings.append(node)
        elif isinstance(node,str):
            self.id = node
        elif isinstance(node,dict):
            self.kw.update(node)        

class SimpleObject(object):
    def __init__(self,*args,**kw):
        self.name = 'Text'
        self.kw = kw
        for arg in args:
            if isinstance(arg,str):
                self.name = arg
            elif isinstance(arg,dict):
                self.kw.update(arg)
    def serialize(self):
        data = self.kw.copy()
        data['name'] = self.name
        return data

class Testing(SimpleObject):
    def serialize(self):
        data = copy.deepcopy(self.kw)
        data['name'] = self.name
        # replace query['data'] from instance of QueryField to serialized dict
        if data['query'].get('data'):
            newdata = []
            for f in data['query']['data']:
                assert isinstance(f,QueryField), '%s is not instance of QueryField' % f
                newdata.append(f.serialize())
            data['query']['data'] =  newdata
        
        # add default expect if it has not.
        if data.get('expect'):
            for key in ('status','header','response'):
                if data['expect'].get(key) is None: continue
                # convert single-value of "status", "header", "response" to list-style value
                if not (isinstance(data['expect'][key],list) or isinstance(data['expect'][key],tuple)):
                    data['expect'][key] = [data['expect'][key]]
        else:
            data['expect'] = {
                'status':['200']
            }
        
        return data

class QueryField(SimpleObject):
    def __init__(self,name,*args,**kw):
        """
        Let 1st and 2nd argument simply maps to fieldname and field-value
        ex. QueryField('age',12,{type:...})
        """
        self.name = name
        value = None
        # kw is sent to w2ui-field for rendering,
        # posible key=value are "required=true", "html={'text':'Your given name'}"
        self.kw = kw
        for arg in args:
            if isinstance(arg,dict):
                self.kw.update(arg)
            else:
                value = arg
        # default value to be empty string
        self.kw['value'] = '' if value is None else value

class Benchmark(SimpleObject):
    pass

def getRootNodes():
    path = '/page'
    nodes = [
        Node('HTTP Hanlder',
            Node('Static Files',
                img = 'fas fa-images',
                testings = [
                    Testing('Get public file',{
                        'priority':2,
                        'query':{
                            'url':'/page/staticfile.html'
                        }
                    }),
                    Testing('Get private file',{
                        'priority':1,
                        'query':{
                            'url':'/unittest/pri/static/mindex.html'
                        }
                    })
                ]
            ),
            Node('Get',
                img = 'fas fa-fish',
                testings = [
                    Testing('Get Request by Golang',{
                            'query':{
                                'url':'/unittest/pri/whoami'
                            }
                        }
                    ),
                    Testing('Get Request by Python',{
                        'query':{
                            'url':'/unittest/py/pri/gethandler',
                            'data':[
                                QueryField('name','George',html={'text':'Your given name'}),
                                QueryField('age',35,required=True)
                            ],
                        },
                        'expect':{
                            'validate':'''
                            (response, xhr, promise)=>{
                                if (parseInt(response.age) < 50) promise.resolve()
                                else promise.reject('message is less than 50')
                            }
                            ''',
                            'responseType':'json',
                            'notes':'''
                            Age should less than 50 (exclusive)
                            ''',
                        }
                    })
                ]
            ),
            Node('Download',
                img = 'fas fa-download',
                testings = [
                    Testing('Dowload by Golang Testing',
                        query = {
                            'url' : '/go/pri/download',
                            'data' :[QueryField('Agree',True)]
                        },
                        expect = {
                            'status':'/^3/',
                            'header':'/attachment/',
                            'response':['/mizuno/i']
                        }
                    ),
                    Testing('Download Image by Python',
                        query = {
                            'url' : '/unittest/py/getimage',
                            'data' : [
                                QueryField('Pin',{
                                    'type':'checkbox'
                                })
                            ],
                        },
                        expect = {
                            'status': '200',
                            'notes':'''
                            <img src="/img/downloadtest.jpg" style="height:200px"/>
                            ''',
                            'responseType':'blob',
                            'renderResponse':'''
                                // javascript
                                (response) => {
                                    let url = URL.createObjectURL(response)
                                    return '<img src="' + url + '" style="height:200px"/>'
                                }
                            '''
                        }
                    )
                ]
            ),
            Node('Post',
                img = 'fas fa-upload',
                testings = [
                    Testing('Post by Golang',
                        query={
                            'url':'/unittest/py/pri/posthandler',
                            'method':'post',
                            'data':{
                                QueryField('name','george'),
                                QueryField('age',20)
                            }
                        },
                        expect={
                            'responseType':'json',
                            'status':200,
                        }
                    ),
                    Testing('Post by Python',
                        query = {
                            'url':'/unittest/py/pri/posthandler',
                            'method':'post',
                            'data':{
                                QueryField('name','george'),
                                QueryField('age',20)
                            }
                        },
                        expect = {
                            'responseType':'json',
                            'status':200,
                        }
                    )
                ]
            ),
            Node('Upload',
                img = 'fas fa-download',
                testings = [
                    Testing('Upload by Golang',
                        query={
                            'url':'/unittest/py/pri/posthandler',
                        },
                        expect={
                            'status':200,
                        }
                    ),
                    Testing('Upload by Python',
                        query={
                            'url':'/unittest/py/pri/posthandler',
                        },
                        expect={
                            'status':200,
                        }
                    ),
                ]
            ),
        ),
        Node(
            'Websocket Handler',
            Node('Overview',
                url = path + '/download.html',
                img = 'fas fa-download',
            ),            
            Node('Foreground Job',
                url = path + '/download.html',
                img = 'fas fa-download',
            ), 
            Node('Background Job',
                url = path + '/download.html',
                img = 'fas fa-download',
            ),            
            Node('Chatting Room',
                url = path + '/download.html',
                img = 'fas fa-download',
            ),            
            Node('gRPC-like',
                url = path + '/download.html',
                img = 'fas fa-download',
            ),            
        ),
        Node('MISC',
            Node('Python Event Loop',
                url = path + '/download.html',
                img = 'fas fa-download',
            ),
        )

    ]
    #return [n.serialize() for n in nodes]
    return nodes

def getInitialNodes():
    node = Node('My Folder')
    node.add(Node('my page',url='/page/usage.html'))
    node.add(Node('my testing',testings = [
        Testing('Static Page',
            query = {
                'url' : '/index.html',
                'data' :[QueryField('Agree')]
            },
            expect = {
                'status':'/^2/',
                'header':'/attachment/',
                'response':['/mizuno/i']
            }
        )]
    ))
    return [ node ]

class Sidebar(object):
    def __init__(self):
        self.node = Node('Testing Nodes')
        self.node.isTopNode = True
        #for node in getInitialNodes():
        for node in getRootNodes():
            self.node.add(node)
    def listAllNodes(self):
        return self.node.serialize()

sidebar = Sidebar()
if __name__ == '__main__':
    outpath = os.path.join(os.path.dirname(__file__),'..','static','pri','sidebarAllNodes.json')
    with open(outpath,'w') as fd:
        json.dump(sidebar.listAllNodes(),fd)
    print('output to ',outpath)
