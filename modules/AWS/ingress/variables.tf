variable "ingress_domain" {
  description = "Domain name for the ingress controller"
  type        = string
  default     = null
}

variable "r53" {
  description = "R53 resources for domain based routing over TLS"
  type = any
}

variable "enable_ssh_tcp" {
  description = "If true, TCP will be enabled at ingress controller level."
  type        = bool
  default     = false
}
