// Code generated by protoc-gen-go. DO NOT EDIT.
// source: grpc_style.proto

package main

import (
	fmt "fmt"
	math "math"

	proto "github.com/golang/protobuf/proto"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion3 // please upgrade the proto package

type HelloRequest struct {
	Greeting             string   `protobuf:"bytes,1,opt,name=greeting,proto3" json:"greeting,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *HelloRequest) Reset()         { *m = HelloRequest{} }
func (m *HelloRequest) String() string { return proto.CompactTextString(m) }
func (*HelloRequest) ProtoMessage()    {}
func (*HelloRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_31584da4b4fc07a5, []int{0}
}

func (m *HelloRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_HelloRequest.Unmarshal(m, b)
}
func (m *HelloRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_HelloRequest.Marshal(b, m, deterministic)
}
func (m *HelloRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_HelloRequest.Merge(m, src)
}
func (m *HelloRequest) XXX_Size() int {
	return xxx_messageInfo_HelloRequest.Size(m)
}
func (m *HelloRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_HelloRequest.DiscardUnknown(m)
}

var xxx_messageInfo_HelloRequest proto.InternalMessageInfo

func (m *HelloRequest) GetGreeting() string {
	if m != nil {
		return m.Greeting
	}
	return ""
}

type HelloReply struct {
	Reply                string   `protobuf:"bytes,1,opt,name=reply,proto3" json:"reply,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *HelloReply) Reset()         { *m = HelloReply{} }
func (m *HelloReply) String() string { return proto.CompactTextString(m) }
func (*HelloReply) ProtoMessage()    {}
func (*HelloReply) Descriptor() ([]byte, []int) {
	return fileDescriptor_31584da4b4fc07a5, []int{1}
}

func (m *HelloReply) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_HelloReply.Unmarshal(m, b)
}
func (m *HelloReply) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_HelloReply.Marshal(b, m, deterministic)
}
func (m *HelloReply) XXX_Merge(src proto.Message) {
	xxx_messageInfo_HelloReply.Merge(m, src)
}
func (m *HelloReply) XXX_Size() int {
	return xxx_messageInfo_HelloReply.Size(m)
}
func (m *HelloReply) XXX_DiscardUnknown() {
	xxx_messageInfo_HelloReply.DiscardUnknown(m)
}

var xxx_messageInfo_HelloReply proto.InternalMessageInfo

func (m *HelloReply) GetReply() string {
	if m != nil {
		return m.Reply
	}
	return ""
}

func init() {
	proto.RegisterType((*HelloRequest)(nil), "grpcstyle.HelloRequest")
	proto.RegisterType((*HelloReply)(nil), "grpcstyle.HelloReply")
}

func init() { proto.RegisterFile("grpc_style.proto", fileDescriptor_31584da4b4fc07a5) }

var fileDescriptor_31584da4b4fc07a5 = []byte{
	// 109 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0x12, 0x48, 0x2f, 0x2a, 0x48,
	0x8e, 0x2f, 0x2e, 0xa9, 0xcc, 0x49, 0xd5, 0x2b, 0x28, 0xca, 0x2f, 0xc9, 0x17, 0xe2, 0x04, 0x89,
	0x80, 0x05, 0x94, 0xb4, 0xb8, 0x78, 0x3c, 0x52, 0x73, 0x72, 0xf2, 0x83, 0x52, 0x0b, 0x4b, 0x53,
	0x8b, 0x4b, 0x84, 0xa4, 0xb8, 0x38, 0xd2, 0x8b, 0x52, 0x53, 0x4b, 0x32, 0xf3, 0xd2, 0x25, 0x18,
	0x15, 0x18, 0x35, 0x38, 0x83, 0xe0, 0x7c, 0x25, 0x25, 0x2e, 0x2e, 0xa8, 0xda, 0x82, 0x9c, 0x4a,
	0x21, 0x11, 0x2e, 0xd6, 0x22, 0x10, 0x03, 0xaa, 0x0c, 0xc2, 0x49, 0x62, 0x03, 0xdb, 0x60, 0x0c,
	0x08, 0x00, 0x00, 0xff, 0xff, 0xc1, 0x4e, 0xbb, 0xe4, 0x75, 0x00, 0x00, 0x00,
}